import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from './src/lib/prisma'
import { Role } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // On first sign in, user object is available
      if (account && user?.email) {
        // Upsert user in database
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            displayName: user.name ?? user.email.split('@')[0],
            role: user.email === 'Patakarawin2547@gmail.com' ? Role.SUPER_ADMIN : Role.STUDENT,
          },
        })

        // Ensure super admin role
        if (user.email === 'Patakarawin2547@gmail.com' && dbUser.role !== Role.SUPER_ADMIN) {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: Role.SUPER_ADMIN },
          })
        }

        token.id = dbUser.id
        token.role = dbUser.role === Role.STUDENT && user.email === 'Patakarawin2547@gmail.com'
          ? Role.SUPER_ADMIN
          : dbUser.role
        token.displayName = dbUser.displayName
        token.isAnonymous = dbUser.isAnonymous
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.displayName = token.displayName as string
        session.user.isAnonymous = token.isAnonymous as boolean
      }
      return session
    },
  },
})
