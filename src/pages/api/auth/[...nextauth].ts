import { PrismaAdapter } from "@next-auth/prisma-adapter";
import axios from "axios"; // Import axios
import NextAuth, {
  ISODateString,
  NextAuthOptions,
  Session,
  User,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../server/db/client";

// Function to verify the reCAPTCHA token
async function verifyRecaptchaToken(token: string) {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
  );
  return response.data.success;
}

interface CustomSession extends Session {
  id: string;
  name: string;
  email: string;
  role: string;
  expires: ISODateString;
}

interface CustomUser extends User {
  ip?: string;
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
        // Verify the reCAPTCHA token

        // Obtenha o IP do cliente
        const ip =
          (req as any).headers?.["x-forwarded-for"] ||
          (req as any).connection?.remoteAddress ||
          "";

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

        // Se a autenticação for bem-sucedida, adicione o IP ao objeto do usuário
        if (user) {
          user.ip = ip;

          console.log(ip, "TESTEEEEEEEEEEEEEEEEE");

          // Atualizando o IP no banco de dados
          await prisma.user.update({
            where: { email: user.email },
            data: { ip: user.ip },
          });
        }

        const customUser: CustomUser = {
          ...user,
          ip,
        };

        return customUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 1 * 3 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: CustomUser | null }) {
      if (user && "ip" in user) {
        token.ip = (user as CustomUser).ip;
      }
      if (user) {
        token.ip = user.ip;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role.name;
      }
      return token;
    },
    async session({ session, token }) {
      const customSession = session as CustomSession;
      if (token) {
        customSession.id = token.id as string;
        customSession.email = token.email as string;
        customSession.name = token.name as string;
        customSession.role = token.role as string;
      }
      return customSession;
    },
  },
  pages: {
    signIn: "/",
  },
};

export default NextAuth(authOptions);
