// Feature: cmu-course-review, Property 6: Average Rating Accuracy
import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateAverageRating } from '../rating'

describe('calculateAverageRating', () => {
  test('returns null for empty array', () => {
    expect(calculateAverageRating([])).toBeNull()
  })

  test('Property 6: average is arithmetic mean rounded to 1 decimal', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 1, maxLength: 50 }),
        (ratings) => {
          const result = calculateAverageRating(ratings)
          if (result === null) return false
          const expected = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          return result === expected
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 6: single rating returns that rating', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3 }), (rating) => {
        return calculateAverageRating([rating]) === rating
      }),
      { numRuns: 100 }
    )
  })
})
