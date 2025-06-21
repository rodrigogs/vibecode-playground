import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtectedPage = nextUrl.pathname.startsWith('/chat')

      if (isOnProtectedPage) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return true
      }

      return true
    },
    jwt({ token, user }) {
      // Include user id in the JWT token
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      // Include user id in the session
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
}
