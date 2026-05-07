import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  const isOnboarding = nextUrl.pathname.startsWith('/onboarding')
  const isAdmin = nextUrl.pathname.startsWith('/admin')
  const isProfile = nextUrl.pathname.startsWith('/profile')
  const isApi = nextUrl.pathname.startsWith('/api')
  const isLogin = nextUrl.pathname.startsWith('/login')
  const isStatic = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname === '/favicon.ico'

  // Skip static and API routes
  if (isApi || isStatic) return NextResponse.next()

  // Read JWT token directly (works on Edge Runtime)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  })

  const isLoggedIn = !!token

  // Redirect unauthenticated users to login for protected routes
  if ((isAdmin || isProfile || isOnboarding) && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl))
  }

  // If logged in and profile not complete OR status not set → redirect to onboarding
  if (
    isLoggedIn &&
    (!token.isProfileComplete || !token.status) &&
    !isOnboarding &&
    !isLogin
  ) {
    return NextResponse.redirect(new URL('/onboarding', nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/onboarding',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
