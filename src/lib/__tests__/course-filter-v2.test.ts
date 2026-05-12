// Feature: cmu-course-review-v2-enhancements, Property 1/2/3/4
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  filterByFaculty,
  filterByCredits,
  filterByFacultyAndCredits,
  CourseForFilterV2,
} from '../course-filter-v2'

// Arbitrary for a CourseForFilterV2
const courseArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 1, maxLength: 10 }),
  facultyId: fc.oneof(fc.constantFrom('eng', 'sci', 'med', 'art'), fc.string({ minLength: 1, maxLength: 5 })),
  credits: fc.oneof(fc.constantFrom('1', '2', '3', '4'), fc.string({ minLength: 1, maxLength: 2 })),
})

describe('filterByFaculty', () => {
  it('returns all courses when facultyId is empty string', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
      { id: '2', code: 'B', facultyId: 'sci', credits: '2' },
    ]
    expect(filterByFaculty(courses, '')).toEqual(courses)
  })

  it('returns only matching courses for a given facultyId', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
      { id: '2', code: 'B', facultyId: 'sci', credits: '2' },
      { id: '3', code: 'C', facultyId: 'eng', credits: '1' },
    ]
    const result = filterByFaculty(courses, 'eng')
    expect(result).toHaveLength(2)
    expect(result.every((c) => c.facultyId === 'eng')).toBe(true)
  })

  it('returns empty array when no courses match', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
    ]
    expect(filterByFaculty(courses, 'med')).toEqual([])
  })
})

describe('filterByCredits', () => {
  it('returns all courses when credits is empty string', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
      { id: '2', code: 'B', facultyId: 'sci', credits: '2' },
    ]
    expect(filterByCredits(courses, '')).toEqual(courses)
  })

  it('returns only matching courses for a given credits value', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
      { id: '2', code: 'B', facultyId: 'sci', credits: '2' },
      { id: '3', code: 'C', facultyId: 'eng', credits: '3' },
    ]
    const result = filterByCredits(courses, '3')
    expect(result).toHaveLength(2)
    expect(result.every((c) => c.credits === '3')).toBe(true)
  })
})

describe('filterByFacultyAndCredits', () => {
  it('returns all courses when both filters are empty', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
      { id: '2', code: 'B', facultyId: 'sci', credits: '2' },
    ]
    expect(filterByFacultyAndCredits(courses, '', '')).toEqual(courses)
  })

  it('applies AND logic — returns intersection of both filters', () => {
    const courses: CourseForFilterV2[] = [
      { id: '1', code: 'A', facultyId: 'eng', credits: '3' },
      { id: '2', code: 'B', facultyId: 'sci', credits: '3' },
      { id: '3', code: 'C', facultyId: 'eng', credits: '2' },
    ]
    const result = filterByFacultyAndCredits(courses, 'eng', '3')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  // Property 1: Faculty filter returns only matching courses
  it('Property 1: filterByFaculty result contains only courses with matching facultyId', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        (courses, facultyId) => {
          const result = filterByFaculty(courses, facultyId)
          expect(result.every((c) => c.facultyId === facultyId)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 2: Credits filter returns only matching courses
  // filterByCredits supports both exact match and prefix match (e.g. "3" matches "3(3-0-6)")
  it('Property 2: filterByCredits result contains only courses with matching credits', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 2 }),
        (courses, credits) => {
          const result = filterByCredits(courses, credits)
          expect(result.every((c) => c.credits === credits || c.credits.startsWith(credits))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 3: Combined faculty + credits filter applies AND logic
  it('Property 3: filterByFacultyAndCredits result equals intersection of individual filters', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 1, maxLength: 2 }),
        (courses, facultyId, credits) => {
          const combined = filterByFacultyAndCredits(courses, facultyId, credits)
          const byFaculty = filterByFaculty(courses, facultyId)
          const intersection = filterByCredits(byFaculty, credits)
          expect(combined).toEqual(intersection)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 4: Empty filters return all courses
  it('Property 4: filterByFacultyAndCredits with empty filters returns all courses', () => {
    fc.assert(
      fc.property(fc.array(courseArb, { minLength: 0, maxLength: 20 }), (courses) => {
        const result = filterByFacultyAndCredits(courses, '', '')
        expect(result).toEqual(courses)
      }),
      { numRuns: 100 }
    )
  })
})
