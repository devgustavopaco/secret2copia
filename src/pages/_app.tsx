// src/pages/_app.tsx
import { withTRPC } from "@trpc/next";
import { SessionProvider } from "next-auth/react";
import type { AppType } from "next/dist/shared/lib/utils";
import NextNProgress from "nextjs-progressbar";
import "nprogress/nprogress.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import superjson from "superjson";
import type { AppRouter } from "../server/router";
import "../styles/globals.scss";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { AppProps } from "next/app";
// Default theme. ~960B

// Optional light theme (extends default). ~400B
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

  return (
    <SessionProvider session={session}>
      <NextNProgress color="#7158e2" />
      {getLayout(<Component {...pageProps} />)}
      <ToastContainer />
    </SessionProvider>
  );
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = `${getBaseUrl()}/api/trpc`;

    return {
      url,
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
})(MyApp);
