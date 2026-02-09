import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { Header } from "../../components/Header";
import { ProVideosExperience } from "../../components/VideosPage/ProVideosExperience";
import { getSupportNumber } from "../../server/db/getSuportNumber";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../api/auth/[...nextauth]";

interface VideosProps {
  supportNumber: string;
}

const Videos: NextPage<VideosProps> = ({ supportNumber }: VideosProps) => {
  const { data: videos, isLoading } = trpc.useQuery(["videos.getVideos"], {
    ssr: true,
    context: {
      skipBatch: true,
    },
  });

  return (
    <>
      <Head>
        <title>Aulas - NEXTGAIN</title>
        <meta name="description" content="Aulas e vídeos - NEXTGAIN" />
      </Head>
      <Header supportNumber={supportNumber} />
      <ProVideosExperience videos={videos || []} isLoading={isLoading} />
    </>
  );
};

export default Videos;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const session = await getServerSession(req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let supportNumber = null;
  try {
    supportNumber = await getSupportNumber();
  } catch (error) {
    console.error("Error fetching support number:", error);
  }

  return {
    props: { supportNumber },
  };
};
