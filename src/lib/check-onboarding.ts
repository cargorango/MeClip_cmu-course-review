import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { prisma } from '@/lib/prisma'

/**
 * Call this at the top of any Server Component page that requires a complete profile.
 * Queries the DB directly — bypasses JWT cache entirely.
 * Redirects to /onboarding if the user's profile is incomplete.
 */
export async function requireCompleteProfile() {
  const session = await auth()
  if (!session?.user?.id) return // Not logged in — let middleware handle it

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, isProfileComplete: true },
  })

  if (!user) return

  // Redirect if profile is incomplete OR status is not set
  if (!user.isProfileComplete || !user.status) {
    redirect('/onboarding')
  }
}
