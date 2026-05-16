import { redirect } from 'next/navigation'
import { auth } from '../../auth'

/**
 * Call this at the top of any Server Component page that requires a complete profile.
 * Reads isProfileComplete and status from the JWT session — no DB query needed.
 * Redirects to /onboarding if the user's profile is incomplete.
 */
export async function requireCompleteProfile() {
  const session = await auth()
  if (!session?.user?.id) return // Not logged in — let middleware handle it

  // isProfileComplete and status are stored in the JWT token via auth.ts callbacks
  if (!session.user.isProfileComplete || !session.user.status) {
    redirect('/onboarding')
  }
}
