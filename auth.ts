import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from './src/lib/prisma'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import Credentials from 'next-auth/providers/credentials'

const PLATFORM_MANAGER_EMAIL = 'Patakarawin2547@gmail.com'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Override providers to include Credentials with full Prisma access
    ...authConfig.providers.filter((p) => {
      const id = typeof p === 'function' ? p({}).id : (p as { id?: string }).id
      return id !== 'credentials'
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).toLowerCase()
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, displayName: true, password: true },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.displayName }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    // Keep authorized callback from authConfig for middleware
    authorized: authConfig.callbacks!.authorized,
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        const isPlatformManager = user.email === PLATFORM_MANAGER_EMAIL

        if (account.provider === 'credentials') {
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
          token.degreeLevel = dbUser.degreeLevel
          token.faculty = dbUser.faculty
          token.alumniYear = dbUser.alumniYear
          token.isProfileComplete = dbUser.isProfileComplete
        } else {
          // Google OAuth
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
          token.degreeLevel = dbUser.degreeLevel
          token.faculty = dbUser.faculty
          token.alumniYear = dbUser.alumniYear
          token.isProfileComplete = dbUser.isProfileComplete
        }
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            displayName: true,
            isAnonymous: true,
            status: true,
            yearOfStudy: true,
            degreeLevel: true,
            faculty: true,
            alumniYear: true,
            isProfileComplete: true,
          },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.displayName = dbUser.displayName
          token.isAnonymous = dbUser.isAnonymous
          token.status = dbUser.status
          token.yearOfStudy = dbUser.yearOfStudy
          token.degreeLevel = dbUser.degreeLevel
          token.faculty = dbUser.faculty
          token.alumniYear = dbUser.alumniYear
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
        session.user.degreeLevel = (token.degreeLevel ?? null) as import('@prisma/client').DegreeLevel | null
        session.user.faculty = (token.faculty ?? null) as string | null
        session.user.alumniYear = (token.alumniYear ?? null) as number | null
        session.user.isProfileComplete = (token.isProfileComplete ?? false) as boolean
      }
      return session
    },
  },
})
