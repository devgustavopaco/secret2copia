import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../server/db/client'

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
          `${process.env.NEXTAUTH_URL}/api/user/checkCredentials`,
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
          return user
        }

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.id = token.id
        session.email = token.email
        session.name = token.name
      }

      return session
    },
  },
  pages: {
    signIn: '/',
  },
}

export default NextAuth(authOptions)
