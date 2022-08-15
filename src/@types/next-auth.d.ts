import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    /** OpenID ID Token */
    role: {
      name: string
    }
  }
  interface Session {
    user: {
      role: {
        name: string
      }
    } & DefaultSession['user']
  }
}
