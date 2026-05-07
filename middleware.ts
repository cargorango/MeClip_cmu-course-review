import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

// Use authConfig (no Prisma) for Edge Runtime compatibility
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isOnboarding = nextUrl.pathname.startsWith('/onboarding')
  const isAdmin = nextUrl.pathname.startsWith('/admin')
  const isProfile = nextUrl.pathname.startsWith('/profile')
  const isApi = nextUrl.pathname.startsWith('/api')
  const isLogin = nextUrl.pathname.startsWith('/login')

  // Skip API routes
  if (isApi) return NextResponse.next()

  // Redirect unauthenticated users to login
  if ((isAdmin || isProfile || isOnboarding) && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl))
  }

  // If logged in and profile not complete, redirect to onboarding
  // (except if already on onboarding, login, or API)
  if (
    isLoggedIn &&
    !session.user.isProfileComplete &&
    !isOnboarding &&
    !isLogin &&
    !isApi
  ) {
    return NextResponse.redirect(new URL('/onboarding', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/onboarding',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
