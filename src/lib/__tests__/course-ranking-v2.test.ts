// Feature: cmu-course-review-v2-enhancements, Property 9/10
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  getTopCoursesByLogCount,
  getCoursesWithReviews,
  CourseWithLogCount,
  CoursesWithReviewsItem,
} from '../course-ranking'

// Arbitrary for CourseWithLogCount
const courseWithLogCountArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 1, maxLength: 10 }),
  nameTh: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  faculty: fc.record({ nameTh: fc.string({ minLength: 1, maxLength: 20 }) }),
  logCount: fc.integer({ min: 0, max: 1000 }),
})

// Arbitrary for CoursesWithReviewsItem
const coursesWithReviewsItemArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 1, maxLength: 10 }),
  nameTh: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  faculty: fc.record({ nameTh: fc.string({ minLength: 1, maxLength: 20 }) }),
  reviewCount: fc.integer({ min: 0, max: 100 }),
  isFreeElective: fc.boolean(),
})

describe('getTopCoursesByLogCount', () => {
  it('returns empty array for empty input', () => {
    expect(getTopCoursesByLogCount([], 5)).toEqual([])
  })

  it('returns at most N courses', () => {
    const courses: CourseWithLogCount[] = [
      { id: '1', code: 'A', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 10 },
      { id: '2', code: 'B', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 5 },
      { id: '3', code: 'C', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 8 },
    ]
    expect(getTopCoursesByLogCount(courses, 2)).toHaveLength(2)
  })

  it('returns courses sorted by logCount descending', () => {
    const courses: CourseWithLogCount[] = [
      { id: '1', code: 'A', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 3 },
      { id: '2', code: 'B', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 10 },
      { id: '3', code: 'C', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 7 },
    ]
    const result = getTopCoursesByLogCount(courses, 3)
    expect(result.map((c) => c.logCount)).toEqual([10, 7, 3])
  })

  it('does not mutate the original array', () => {
    const courses: CourseWithLogCount[] = [
      { id: '1', code: 'A', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 5 },
      { id: '2', code: 'B', nameTh: '', name: '', faculty: { nameTh: '' }, logCount: 10 },
    ]
    const original = [...courses]
    getTopCoursesByLogCount(courses, 2)
    expect(courses).toEqual(original)
  })

  // Property 9: Most-Searched ranking returns top-N by combined log count
  it('Property 9: getTopCoursesByLogCount returns exactly the N courses with highest logCount in descending order', () => {
    fc.assert(
      fc.property(
        fc.array(courseWithLogCountArb, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 0, max: 15 }),
        (courses, n) => {
          const result = getTopCoursesByLogCount(courses, n)

          // Result length is min(n, courses.length)
          expect(result.length).toBe(Math.min(n, courses.length))

          // Result is sorted descending by logCount
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].logCount).toBeGreaterThanOrEqual(result[i + 1].logCount)
          }

          // All returned courses are in the top-N by logCount
          if (result.length > 0 && courses.length > n) {
            const minInResult = Math.min(...result.map((c) => c.logCount))
            const notInResult = courses.filter((c) => !result.some((r) => r.id === c.id))
            for (const c of notInResult) {
              expect(c.logCount).toBeLessThanOrEqual(minInResult)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('getCoursesWithReviews', () => {
  it('returns empty array for empty input', () => {
    expect(getCoursesWithReviews([])).toEqual([])
  })

  it('excludes free electives', () => {
    const courses: CoursesWithReviewsItem[] = [
      {
        id: '1',
        code: 'A',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 5,
        isFreeElective: true,
      },
      {
        id: '2',
        code: 'B',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 3,
        isFreeElective: false,
      },
    ]
    const result = getCoursesWithReviews(courses)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('excludes courses with zero reviews', () => {
    const courses: CoursesWithReviewsItem[] = [
      {
        id: '1',
        code: 'A',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 0,
        isFreeElective: false,
      },
      {
        id: '2',
        code: 'B',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 5,
        isFreeElective: false,
      },
    ]
    const result = getCoursesWithReviews(courses)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('sorts descending by reviewCount', () => {
    const courses: CoursesWithReviewsItem[] = [
      {
        id: '1',
        code: 'A',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 3,
        isFreeElective: false,
      },
      {
        id: '2',
        code: 'B',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 10,
        isFreeElective: false,
      },
      {
        id: '3',
        code: 'C',
        nameTh: '',
        name: '',
        faculty: { nameTh: '' },
        reviewCount: 7,
        isFreeElective: false,
      },
    ]
    const result = getCoursesWithReviews(courses)
    expect(result.map((c) => c.reviewCount)).toEqual([10, 7, 3])
  })

  // Property 10: Courses-With-Reviews section excludes free electives and zero-review courses
  it('Property 10: getCoursesWithReviews result contains only non-free-elective courses with reviewCount > 0, sorted descending', () => {
    fc.assert(
      fc.property(
        fc.array(coursesWithReviewsItemArb, { minLength: 0, maxLength: 30 }),
        (courses) => {
          const result = getCoursesWithReviews(courses)

          // All results are non-free-elective and have reviewCount > 0
          for (const c of result) {
            expect(c.isFreeElective).toBe(false)
            expect(c.reviewCount).toBeGreaterThan(0)
          }

          // Result is sorted descending by reviewCount
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].reviewCount).toBeGreaterThanOrEqual(result[i + 1].reviewCount)
          }

          // All eligible courses from input are included
          const eligible = courses.filter((c) => !c.isFreeElective && c.reviewCount > 0)
          expect(result.length).toBe(eligible.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})
