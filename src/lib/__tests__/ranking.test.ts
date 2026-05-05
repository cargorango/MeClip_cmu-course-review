// Feature: cmu-course-review, Property 1: Top-N Course Ranking Correctness
import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import { getTopCoursesByReviews, CourseWithCount } from '../course-ranking'

const courseWithCountArb = fc.record({
  id: fc.string({ minLength: 1 }),
  code: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  nameTh: fc.string({ minLength: 1 }),
  reviewCount: fc.nat({ max: 1000 }),
})

describe('getTopCoursesByReviews', () => {
  test('Property 1: top-N returns courses with highest review counts', () => {
    fc.assert(
      fc.property(
        fc.array(courseWithCountArb, { minLength: 3, maxLength: 20 }),
        fc.integer({ min: 1, max: 5 }),
        (courses, n) => {
          const result = getTopCoursesByReviews(courses, n)
          const sortedAll = [...courses].sort((a, b) => b.reviewCount - a.reviewCount)
          const expectedTop = sortedAll.slice(0, n)
          // result should have same ids as expectedTop
          const resultIds = result.map(c => c.id).sort()
          const expectedIds = expectedTop.map(c => c.id).sort()
          return JSON.stringify(resultIds) === JSON.stringify(expectedIds)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 1: result is sorted descending by reviewCount', () => {
    fc.assert(
      fc.property(
        fc.array(courseWithCountArb, { minLength: 1, maxLength: 20 }),
        (courses) => {
          const result = getTopCoursesByReviews(courses, 3)
          for (let i = 1; i < result.length; i++) {
            if (result[i].reviewCount > result[i - 1].reviewCount) return false
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('returns at most n courses', () => {
    fc.assert(
      fc.property(
        fc.array(courseWithCountArb, { maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (courses, n) => {
          const result = getTopCoursesByReviews(courses, n)
          return result.length <= n && result.length <= courses.length
        }
      ),
      { numRuns: 100 }
    )
  })
})
