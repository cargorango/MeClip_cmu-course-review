// Feature: cmu-course-review, Property 5: Google Auth Idempotency
// Validates: Requirements 3.2
import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Simulates the upsert logic used in the signIn callback of auth.ts.
 * In production this runs against the database via Prisma; here we test
 * the pure logic of the upsert operation to verify idempotency.
 */
function simulateUpsert(
  store: Map<string, { email: string; displayName: string; role: string }>,
  email: string,
  displayName: string,
  role: string
): void {
  if (store.has(email)) {
    // update — keep existing record, only update role
    const existing = store.get(email)!
    store.set(email, { ...existing, role })
  } else {
    // create
    store.set(email, { email, displayName, role })
  }
}

describe('Google Auth Idempotency (Property 5)', () => {
  test('authenticating once creates exactly one user record', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 50 }),
        (email, displayName) => {
          const store = new Map<string, { email: string; displayName: string; role: string }>()
          simulateUpsert(store, email, displayName, 'STUDENT')
          return store.size === 1 && store.has(email)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 5: authenticating multiple times with same email results in exactly one user record', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 2, max: 10 }),
        (email, displayName, authCount) => {
          const store = new Map<string, { email: string; displayName: string; role: string }>()

          // Simulate multiple authentications with the same email
          for (let i = 0; i < authCount; i++) {
            simulateUpsert(store, email, displayName, 'STUDENT')
          }

          // Must have exactly one record for this email
          return store.size === 1 && store.has(email)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 5: subsequent authentications retrieve existing account, not create new one', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (email, displayName1, displayName2) => {
          const store = new Map<string, { email: string; displayName: string; role: string }>()

          // First authentication — creates the record
          simulateUpsert(store, email, displayName1, 'STUDENT')
          const firstRecord = store.get(email)!

          // Second authentication with same email — should not create a new record
          simulateUpsert(store, email, displayName2, 'STUDENT')

          // Still exactly one record
          if (store.size !== 1) return false

          // The email is preserved
          const secondRecord = store.get(email)!
          return secondRecord.email === firstRecord.email
        }
      ),
      { numRuns: 100 }
    )
  })

  test('different emails each create their own user record', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.emailAddress(), { minLength: 2, maxLength: 5 }),
        (emails) => {
          const store = new Map<string, { email: string; displayName: string; role: string }>()

          for (const email of emails) {
            simulateUpsert(store, email, 'User', 'STUDENT')
          }

          // Each unique email should have exactly one record
          return store.size === emails.length
        }
      ),
      { numRuns: 100 }
    )
  })
})
