// Feature: cmu-course-review-v2-enhancements, Property 6/7/8
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { sortByReviews, sortByGrade, sortByCode, CourseForSort } from '../course-sort'
import { GRADE_VALUES, GradeValue } from '../grade-stats'

// Arbitrary for a CourseForSort
const gradeProportionsArb = fc.record(
  Object.fromEntries(GRADE_VALUES.map((g) => [g, fc.float({ min: 0, max: 1, noNaN: true })])) as Record<
    GradeValue,
    fc.Arbitrary<number>
  >
) as fc.Arbitrary<Record<GradeValue, number>>

const courseArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 1, maxLength: 10 }),
  reviewCount: fc.integer({ min: 0, max: 1000 }),
  gradeProportions: gradeProportionsArb,
})

describe('sortByReviews', () => {
  it('returns empty array for empty input', () => {
    expect(sortByReviews([])).toEqual([])
  })

  it('does not mutate the original array', () => {
    const courses: CourseForSort[] = [
      { id: '1', code: 'A', reviewCount: 5, gradeProportions: {} as Record<GradeValue, number> },
      { id: '2', code: 'B', reviewCount: 10, gradeProportions: {} as Record<GradeValue, number> },
    ]
    const original = [...courses]
    sortByReviews(courses)
    expect(courses).toEqual(original)
  })

  it('sorts descending by reviewCount', () => {
    const courses: CourseForSort[] = [
      { id: '1', code: 'A', reviewCount: 3, gradeProportions: {} as Record<GradeValue, number> },
      { id: '2', code: 'B', reviewCount: 10, gradeProportions: {} as Record<GradeValue, number> },
      { id: '3', code: 'C', reviewCount: 1, gradeProportions: {} as Record<GradeValue, number> },
    ]
    const result = sortByReviews(courses)
    expect(result.map((c) => c.reviewCount)).toEqual([10, 3, 1])
  })

  // Property 6: Sort by reviews produces descending review count order
  it('Property 6: result[i].reviewCount >= result[i+1].reviewCount for all i', () => {
    fc.assert(
      fc.property(fc.array(courseArb, { minLength: 0, maxLength: 20 }), (courses) => {
        const result = sortByReviews(courses)
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].reviewCount).toBeGreaterThanOrEqual(result[i + 1].reviewCount)
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('sortByGrade', () => {
  it('returns empty array for empty input', () => {
    expect(sortByGrade([], 'A')).toEqual([])
  })

  it('does not mutate the original array', () => {
    const courses: CourseForSort[] = [
      {
        id: '1',
        code: 'A',
        reviewCount: 5,
        gradeProportions: { A: 0.5, 'B+': 0, B: 0, 'C+': 0, C: 0, 'D+': 0, D: 0, F: 0 },
      },
    ]
    const original = [...courses]
    sortByGrade(courses, 'A')
    expect(courses).toEqual(original)
  })

  // Property 7: Sort by grade produces descending grade-proportion order
  it('Property 7: result[i].gradeProportions[g] >= result[i+1].gradeProportions[g] for all i', () => {
    const gradeArb = fc.constantFrom(...GRADE_VALUES)
    fc.assert(
      fc.property(fc.array(courseArb, { minLength: 0, maxLength: 20 }), gradeArb, (courses, grade) => {
        const result = sortByGrade(courses, grade)
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].gradeProportions[grade]).toBeGreaterThanOrEqual(
            result[i + 1].gradeProportions[grade]
          )
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('sortByCode', () => {
  it('returns empty array for empty input', () => {
    expect(sortByCode([])).toEqual([])
  })

  it('does not mutate the original array', () => {
    const courses = [{ code: 'B' }, { code: 'A' }]
    const original = [...courses]
    sortByCode(courses)
    expect(courses).toEqual(original)
  })

  it('sorts ascending by code', () => {
    const courses = [{ code: 'C' }, { code: 'A' }, { code: 'B' }]
    const result = sortByCode(courses)
    expect(result.map((c) => c.code)).toEqual(['A', 'B', 'C'])
  })

  // Property 8: Default sort produces ascending course code order
  it('Property 8: result[i].code <= result[i+1].code lexicographically for all i', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ code: fc.string({ minLength: 1, maxLength: 10 }) }), {
          minLength: 0,
          maxLength: 20,
        }),
        (courses) => {
          const result = sortByCode(courses)
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].code.localeCompare(result[i + 1].code)).toBeLessThanOrEqual(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
