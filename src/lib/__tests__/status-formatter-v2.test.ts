// Feature: cmu-course-review-v2-enhancements, Property 16
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formatAnonymousLabel, UserStatus } from '../status-formatter'

const statusArb = fc.constantFrom<UserStatus>('STUDENT', 'TEACHER', 'ALUMNI')
const nullableStringArb = fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null })
const nullableIntArb = fc.option(fc.integer({ min: 1, max: 100 }), { nil: null })

describe('formatAnonymousLabel', () => {
  // Unit tests for STUDENT
  it('STUDENT with faculty and year → "นักศึกษาคณะ [faculty] ชั้นปี [year]"', () => {
    expect(formatAnonymousLabel('STUDENT', 'วิศวกรรมศาสตร์', 3, null)).toBe(
      'นักศึกษาคณะ วิศวกรรมศาสตร์ ชั้นปี 3'
    )
  })

  it('STUDENT with faculty only → "นักศึกษาคณะ [faculty]"', () => {
    expect(formatAnonymousLabel('STUDENT', 'วิทยาศาสตร์', null, null)).toBe(
      'นักศึกษาคณะ วิทยาศาสตร์'
    )
  })

  it('STUDENT with year only → "นักศึกษา ชั้นปี [year]"', () => {
    expect(formatAnonymousLabel('STUDENT', null, 2, null)).toBe('นักศึกษา ชั้นปี 2')
  })

  it('STUDENT with neither → "นักศึกษา"', () => {
    expect(formatAnonymousLabel('STUDENT', null, null, null)).toBe('นักศึกษา')
  })

  // Unit tests for TEACHER
  it('TEACHER with faculty → "อาจารย์คณะ [faculty]"', () => {
    expect(formatAnonymousLabel('TEACHER', 'วิศวะ', null, null)).toBe('อาจารย์คณะ วิศวะ')
  })

  it('TEACHER without faculty → "อาจารย์"', () => {
    expect(formatAnonymousLabel('TEACHER', null, null, null)).toBe('อาจารย์')
  })

  // Unit tests for ALUMNI
  it('ALUMNI with alumniYear → "ศิษย์เก่ารุ่น [alumniYear]"', () => {
    expect(formatAnonymousLabel('ALUMNI', null, null, 65)).toBe('ศิษย์เก่ารุ่น 65')
  })

  it('ALUMNI without alumniYear → "ศิษย์เก่า"', () => {
    expect(formatAnonymousLabel('ALUMNI', null, null, null)).toBe('ศิษย์เก่า')
  })

  it('trims whitespace from faculty', () => {
    expect(formatAnonymousLabel('TEACHER', '  วิศวะ  ', null, null)).toBe('อาจารย์คณะ วิศวะ')
  })

  it('returns fallback for unknown status', () => {
    expect(formatAnonymousLabel('UNKNOWN', null, null, null)).toBe('ไม่ระบุตัวตน')
  })

  // Property 16: Anonymous label format is correct for all status/profile combinations
  it('Property 16: formatAnonymousLabel returns non-empty string for all valid combinations', () => {
    fc.assert(
      fc.property(
        statusArb,
        nullableStringArb,
        nullableIntArb,
        nullableIntArb,
        (status, faculty, yearOfStudy, alumniYear) => {
          const result = formatAnonymousLabel(status, faculty, yearOfStudy, alumniYear)

          // Must return a non-empty string
          expect(typeof result).toBe('string')
          expect(result.length).toBeGreaterThan(0)

          // Verify format rules
          if (status === 'STUDENT') {
            const facultyTrimmed = faculty?.trim() || null
            if (facultyTrimmed && yearOfStudy != null) {
              expect(result).toBe(`นักศึกษาคณะ ${facultyTrimmed} ชั้นปี ${yearOfStudy}`)
            } else if (facultyTrimmed) {
              expect(result).toBe(`นักศึกษาคณะ ${facultyTrimmed}`)
            } else if (yearOfStudy != null) {
              expect(result).toBe(`นักศึกษา ชั้นปี ${yearOfStudy}`)
            } else {
              expect(result).toBe('นักศึกษา')
            }
          } else if (status === 'TEACHER') {
            const facultyTrimmed = faculty?.trim() || null
            if (facultyTrimmed) {
              expect(result).toBe(`อาจารย์คณะ ${facultyTrimmed}`)
            } else {
              expect(result).toBe('อาจารย์')
            }
          } else if (status === 'ALUMNI') {
            if (alumniYear != null) {
              expect(result).toBe(`ศิษย์เก่ารุ่น ${alumniYear}`)
            } else {
              expect(result).toBe('ศิษย์เก่า')
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
