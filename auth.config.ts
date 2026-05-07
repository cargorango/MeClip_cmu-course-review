import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const authConfig: NextAuthConfig = {
  trustHost: true,
  cookies: {
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Credentials provider — actual password verification happens in auth.ts
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is overridden in auth.ts with full Prisma access
      async authorize() {
        return null
      },
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
      const isOnOnboardingPage = nextUrl.pathname.startsWith('/onboarding')

      if (isOnAdminPage || isOnProfilePage || isOnOnboardingPage) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
    // This session callback runs in middleware context (Edge Runtime)
    // It maps JWT token fields → session.user so middleware can read them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: any) {
      if (token && session.user) {
        session.user.isProfileComplete = token.isProfileComplete ?? false
        session.user.status = token.status ?? null
      }
      return session
    },
    // Pass-through jwt callback — actual logic is in auth.ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token }: any) {
      return token
    },
  },
}
