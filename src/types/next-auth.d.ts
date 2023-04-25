import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    /** OpenID ID Token */
    role: {
      name: string;
    };
  }
  interface Session {
    role: string;
    user: {
      role: string;
    } & DefaultSession["user"];
  }
}
