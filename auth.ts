import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from './src/lib/prisma'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const PLATFORM_MANAGER_EMAIL = 'Patakarawin2547@gmail.com'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // On first sign in, user object is available
      if (account && user?.email) {
        const isPlatformManager = user.email === PLATFORM_MANAGER_EMAIL

        if (account.provider === 'credentials') {
          // Credentials login — password already verified in authorize()
          // user object contains { email, verifiedUserId } set by authorize
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (!dbUser) return token

          token.id = dbUser.id
          token.role = dbUser.role
          token.displayName = dbUser.displayName
          token.isAnonymous = dbUser.isAnonymous
          token.status = dbUser.status
          token.yearOfStudy = dbUser.yearOfStudy
          token.isProfileComplete = dbUser.isProfileComplete
        } else {
          // Google OAuth login
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
              email: user.email,
              displayName: user.name ?? user.email.split('@')[0],
              role: isPlatformManager ? Role.PLATFORM_MANAGER : Role.STUDENT,
              isProfileComplete: false,
            },
          })

          // Ensure platform manager role
          if (isPlatformManager && dbUser.role !== Role.PLATFORM_MANAGER) {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: Role.PLATFORM_MANAGER },
            })
          }

          const finalRole = isPlatformManager ? Role.PLATFORM_MANAGER : dbUser.role

          token.id = dbUser.id
          token.role = finalRole
          token.displayName = dbUser.displayName
          token.isAnonymous = dbUser.isAnonymous
          token.status = dbUser.status
          token.yearOfStudy = dbUser.yearOfStudy
          token.isProfileComplete = dbUser.isProfileComplete
        }
      } else if (token.id) {
        // Refresh from DB on every token refresh
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            displayName: true,
            isAnonymous: true,
            status: true,
            yearOfStudy: true,
            isProfileComplete: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.displayName = dbUser.displayName
          token.isAnonymous = dbUser.isAnonymous
          token.status = dbUser.status
          token.yearOfStudy = dbUser.yearOfStudy
          token.isProfileComplete = dbUser.isProfileComplete
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.displayName = token.displayName as string
        session.user.isAnonymous = token.isAnonymous as boolean
        session.user.status = (token.status ?? null) as import('@prisma/client').UserStatus | null
        session.user.yearOfStudy = (token.yearOfStudy ?? null) as number | null
        session.user.isProfileComplete = (token.isProfileComplete ?? false) as boolean
      }
      return session
    },
  },
})
