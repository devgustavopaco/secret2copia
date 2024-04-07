import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    id: ?string;

    email: ?string;

    name: ?string;

    role: ?string;

    createdAt?: Date;
    user?: {
      id?: string;
    } & DefaultSession["user"];
  }
}
