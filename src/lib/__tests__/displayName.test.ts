// Feature: cmu-course-review, Property 13: Display Name Validation
import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateDisplayName } from '../validation'

describe('validateDisplayName', () => {
  test('Property 13: accepts strings of length 1-50', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (name) => validateDisplayName(name) === true
      ),
      { numRuns: 100 }
    )
  })

  test('Property 13: rejects empty string', () => {
    expect(validateDisplayName('')).toBe(false)
  })

  test('Property 13: rejects strings longer than 50 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 51, maxLength: 200 }),
        (name) => validateDisplayName(name) === false
      ),
      { numRuns: 100 }
    )
  })

  test('accepts exactly 1 character', () => {
    expect(validateDisplayName('A')).toBe(true)
  })

  test('accepts exactly 50 characters', () => {
    expect(validateDisplayName('A'.repeat(50))).toBe(true)
  })

  test('rejects 51 characters', () => {
    expect(validateDisplayName('A'.repeat(51))).toBe(false)
  })
})
