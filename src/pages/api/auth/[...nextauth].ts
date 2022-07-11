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
      async authorize(credentials, _req) {
        const user = { id: 1, name: credentials?.email ?? 'J Smith' }
        return user
      },
    }),
  ],
}

export default NextAuth(authOptions)
