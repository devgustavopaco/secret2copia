import { PrismaAdapter } from "@next-auth/prisma-adapter";
import axios from "axios"; // Import axios
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../server/db/client";

// Function to verify the reCAPTCHA token
async function verifyRecaptchaToken(token: string) {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
  );
  return response.data.success;
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    // ...add more providers here
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "exemplo@exemplo.com",
        },
        password: {
          label: "Senha",
          type: "password",
          placeholder: "Senha",
        },
      },
      async authorize(credentials, req) {
        console.log(req.body);
        if (!(await verifyRecaptchaToken(req.body?.recaptchaToken))) {
          throw new Error("Invalid reCAPTCHA token.");
        }

        const user = await fetch(
          `${process.env.NEXTAUTH_URL}/api/users/checkCredentials`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify(credentials),
          }
        )
          .then((response) => response.json())
          .catch((err) => console.error("Email ou senha inválidos"));
        if (!user) {
          throw new Error("Email ou senha inválidos");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 1 * 3 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.id = token.id as string;
        session.email = token.email as string;
        session.name = token.name as string;
        session.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export default NextAuth(authOptions);
