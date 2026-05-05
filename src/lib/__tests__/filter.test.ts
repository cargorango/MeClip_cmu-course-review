// Feature: cmu-course-review, Property 2: Curriculum Filter Completeness
import { describe, test } from 'vitest'
import * as fc from 'fast-check'
import { filterByCurriculum, CourseForFilter } from '../course-filter'

const courseArb = fc.record({
  id: fc.string({ minLength: 1 }),
  code: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  nameTh: fc.string({ minLength: 1 }),
  curriculumId: fc.string({ minLength: 1 }),
  facultyId: fc.string({ minLength: 1 }),
})

describe('filterByCurriculum', () => {
  test('Property 2: result contains only courses matching curriculumId', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { maxLength: 20 }),
        fc.string({ minLength: 1 }),
        (courses, curriculumId) => {
          const result = filterByCurriculum(courses, curriculumId)
          return result.every(c => c.curriculumId === curriculumId)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 2: result contains ALL courses matching curriculumId', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { maxLength: 20 }),
        fc.string({ minLength: 1 }),
        (courses, curriculumId) => {
          const result = filterByCurriculum(courses, curriculumId)
          const expected = courses.filter(c => c.curriculumId === curriculumId)
          return result.length === expected.length
        }
      ),
      { numRuns: 100 }
    )
  })
})
