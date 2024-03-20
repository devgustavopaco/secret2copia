import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    /** OpenID ID Token */
    role: {
      name: string;
    };
  }
  interface Session {
    id: string;
    email: string;

    name: string;

    role: string;
    user: {
      role: string;
    } & DefaultSession["user"];
    jwt: string;
  }
}
