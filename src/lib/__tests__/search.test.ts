// Feature: cmu-course-review, Property 3: Course Search Correctness
import { describe, test } from 'vitest'
import * as fc from 'fast-check'
import { searchCourses, CourseForSearch } from '../course-search'

const courseArb = fc.record({
  id: fc.string({ minLength: 1 }),
  code: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  nameTh: fc.string({ minLength: 1 }),
  curriculumId: fc.string({ minLength: 1 }),
  facultyId: fc.string({ minLength: 1 }),
})

describe('searchCourses', () => {
  test('Property 3: result contains only courses matching query', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter(q => q.trim().length > 0),
        (courses, query) => {
          const result = searchCourses(courses, query)
          const lowerQuery = query.toLowerCase()
          return result.every(
            c =>
              c.code.toLowerCase().includes(lowerQuery) ||
              c.name.toLowerCase().includes(lowerQuery) ||
              c.nameTh.toLowerCase().includes(lowerQuery)
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Property 3: result contains ALL courses matching query', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter(q => q.trim().length > 0),
        (courses, query) => {
          const result = searchCourses(courses, query)
          const lowerQuery = query.toLowerCase()
          const expected = courses.filter(
            c =>
              c.code.toLowerCase().includes(lowerQuery) ||
              c.name.toLowerCase().includes(lowerQuery) ||
              c.nameTh.toLowerCase().includes(lowerQuery)
          )
          return result.length === expected.length
        }
      ),
      { numRuns: 100 }
    )
  })

  test('empty query returns all courses', () => {
    fc.assert(
      fc.property(
        fc.array(courseArb, { maxLength: 20 }),
        (courses) => {
          return searchCourses(courses, '').length === courses.length
        }
      ),
      { numRuns: 50 }
    )
  })
})
