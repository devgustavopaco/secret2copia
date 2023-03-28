import NextAuth, { NextAuthOptions, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../server/db/client'
interface CustomSession extends Session {
  id: string
  name: string
  email: string
}

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    // ...add more providers here
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'exemplo@exemplo.com',
        },
        password: {
          label: 'Senha',
          type: 'password',
          placeholder: 'Senha',
        },
      },
      async authorize(credentials, req) {
        const user = await fetch(
          `${process.env.NEXTAUTH_URL}/api/users/checkCredentials`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              accept: 'application/json',
            },
            body: JSON.stringify(credentials),
          }
        )
          .then((response) => response.json())
          .catch((err) => console.error(err))
        if (user) {
          // console.log(user)
          return user
        }
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 1 * 3 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role.name
      }
      return token
    },
    async session({ session, token }) {
      const customSession = session as CustomSession
      if (token) {
        customSession.id = token.id as string
        customSession.email = token.email as string
        customSession.name = token.name as string
        customSession.role = token.role as any
      }
      return customSession
    },
  },
  pages: {
    signIn: '/',
  },
}
export default NextAuth(authOptions)
