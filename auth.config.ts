import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdminPage = nextUrl.pathname.startsWith('/admin')
      const isOnProfilePage = nextUrl.pathname.startsWith('/profile')

      if (isOnAdminPage || isOnProfilePage) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }
      return true
    },
  },
}
