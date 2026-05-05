// Feature: cmu-course-review, Property 12: Reviewer Level Assignment
import { describe, test } from 'vitest'
import * as fc from 'fast-check'
import { calculateReviewerLevel } from '../reviewer-level'

describe('calculateReviewerLevel', () => {
  test('Property 12: level is น้องใหม่ for counts 1-5', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (count) => {
        return calculateReviewerLevel(count) === 'น้องใหม่'
      }),
      { numRuns: 100 }
    )
  })

  test('Property 12: level is มีประสบการณ์ for counts 6-10', () => {
    fc.assert(
      fc.property(fc.integer({ min: 6, max: 10 }), (count) => {
        return calculateReviewerLevel(count) === 'มีประสบการณ์'
      }),
      { numRuns: 100 }
    )
  })

  test('Property 12: level is ตำนานมหาลัย for counts >= 11', () => {
    fc.assert(
      fc.property(fc.integer({ min: 11, max: 200 }), (count) => {
        return calculateReviewerLevel(count) === 'ตำนานมหาลัย'
      }),
      { numRuns: 100 }
    )
  })

  test('Property 12: count 0 returns น้องใหม่', () => {
    return calculateReviewerLevel(0) === 'น้องใหม่'
  })
})
