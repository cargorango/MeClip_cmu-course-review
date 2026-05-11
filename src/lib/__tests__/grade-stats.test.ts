// Feature: cmu-course-review-v2-enhancements, Property 12/13
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeGradeStats, GRADE_VALUES, GradeValue } from '../grade-stats'

describe('computeGradeStats', () => {
  // Unit tests
  it('returns null for empty array', () => {
    expect(computeGradeStats([])).toBeNull()
  })

  it('returns null for array with only invalid/null values', () => {
    expect(computeGradeStats([null, undefined, 'X', 'Z', ''])).toBeNull()
  })

  it('returns correct stats for a single grade', () => {
    const result = computeGradeStats(['A'])
    expect(result).not.toBeNull()
    expect(result!.total).toBe(1)
    expect(result!.mostCommon).toBe('A')
    const aEntry = result!.grades.find((g) => g.grade === 'A')
    expect(aEntry?.count).toBe(1)
    expect(aEntry?.percentage).toBe(100)
  })

  it('computes correct percentages for mixed grades', () => {
    const result = computeGradeStats(['A', 'A', 'B', 'F'])
    expect(result).not.toBeNull()
    expect(result!.total).toBe(4)
    const aEntry = result!.grades.find((g) => g.grade === 'A')
    expect(aEntry?.count).toBe(2)
    expect(aEntry?.percentage).toBe(50)
    const bEntry = result!.grades.find((g) => g.grade === 'B')
    expect(bEntry?.count).toBe(1)
    expect(bEntry?.percentage).toBe(25)
  })

  it('ignores null, undefined, and invalid grade strings', () => {
    const result = computeGradeStats(['A', null, undefined, 'INVALID', 'B'])
    expect(result).not.toBeNull()
    expect(result!.total).toBe(2)
  })

  it('picks mostCommon as first in GRADE_VALUES order on tie', () => {
    // A and B both have count 1 — A comes first in GRADE_VALUES
    const result = computeGradeStats(['A', 'B'])
    expect(result!.mostCommon).toBe('A')
  })

  it('includes all GRADE_VALUES in grades array with zero counts for missing grades', () => {
    const result = computeGradeStats(['A'])
    expect(result!.grades).toHaveLength(GRADE_VALUES.length)
    const fEntry = result!.grades.find((g) => g.grade === 'F')
    expect(fEntry?.count).toBe(0)
    expect(fEntry?.percentage).toBe(0)
  })

  // Property 12: Grade stats computation is correct for any grade distribution
  it('Property 12: sum(counts) === total, percentages correct, mostCommon has highest count', () => {
    const gradeArb = fc.constantFrom(...GRADE_VALUES)
    const nullableGradeArb = fc.option(gradeArb, { nil: null })

    fc.assert(
      fc.property(fc.array(nullableGradeArb, { minLength: 0, maxLength: 50 }), (inputs) => {
        const result = computeGradeStats(inputs)
        const validCount = inputs.filter((g) => g != null).length

        if (validCount === 0) {
          expect(result).toBeNull()
          return
        }

        expect(result).not.toBeNull()
        const { total, grades, mostCommon } = result!

        // sum(counts) === total
        const sumCounts = grades.reduce((acc, g) => acc + g.count, 0)
        expect(sumCounts).toBe(total)
        expect(total).toBe(validCount)

        // each percentage is correct
        for (const entry of grades) {
          const expectedPct = Math.round((entry.count / total) * 1000) / 10
          expect(entry.percentage).toBe(expectedPct)
        }

        // mostCommon has the highest count
        if (mostCommon !== null) {
          const mostCommonEntry = grades.find((g) => g.grade === mostCommon)!
          for (const entry of grades) {
            expect(mostCommonEntry.count).toBeGreaterThanOrEqual(entry.count)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  // Property 13: Grade stored with message is retrievable unchanged
  it('Property 13: computeGradeStats([grade]) returns the grade unchanged for any GradeValue', () => {
    const gradeArb = fc.constantFrom(...GRADE_VALUES)

    fc.assert(
      fc.property(gradeArb, (grade: GradeValue) => {
        const result = computeGradeStats([grade])
        expect(result).not.toBeNull()
        expect(result!.mostCommon).toBe(grade)
        expect(result!.total).toBe(1)
        const entry = result!.grades.find((g) => g.grade === grade)
        expect(entry?.count).toBe(1)
        expect(entry?.percentage).toBe(100)
      }),
      { numRuns: 100 }
    )
  })
})
