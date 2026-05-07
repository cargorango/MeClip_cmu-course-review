import { DegreeLevel, Role, UserStatus } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      displayName: string
      isAnonymous: boolean
      status: UserStatus | null
      yearOfStudy: number | null
      degreeLevel: DegreeLevel | null
      faculty: string | null
      alumniYear: number | null
      isProfileComplete: boolean
    } & DefaultSession['user']
  }
}
