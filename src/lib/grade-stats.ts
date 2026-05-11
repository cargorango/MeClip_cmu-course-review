export const GRADE_VALUES = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'] as const
export type GradeValue = (typeof GRADE_VALUES)[number]

export interface GradeDistribution {
  total: number
  grades: { grade: GradeValue; count: number; percentage: number }[]
  mostCommon: GradeValue | null
}

/**
 * Pure function — computes grade distribution statistics from an array of grade strings.
 * Returns null when no valid grades exist.
 *
 * @param grades - Array of grade strings (may include null/undefined/invalid values)
 * @returns GradeDistribution or null if no valid grades
 */
export function computeGradeStats(
  grades: (string | null | undefined)[]
): GradeDistribution | null {
  // Build a count map for valid grades only
  const countMap = new Map<GradeValue, number>()
  for (const g of GRADE_VALUES) {
    countMap.set(g, 0)
  }

  let total = 0
  for (const g of grades) {
    if (g != null && (GRADE_VALUES as readonly string[]).includes(g)) {
      const grade = g as GradeValue
      countMap.set(grade, (countMap.get(grade) ?? 0) + 1)
      total++
    }
  }

  if (total === 0) return null

  const gradeEntries = GRADE_VALUES.map((grade) => {
    const count = countMap.get(grade) ?? 0
    const percentage = Math.round((count / total) * 1000) / 10
    return { grade, count, percentage }
  })

  // mostCommon: grade with highest count; first in GRADE_VALUES order on tie
  let mostCommon: GradeValue | null = null
  let maxCount = -1
  for (const entry of gradeEntries) {
    if (entry.count > maxCount) {
      maxCount = entry.count
      mostCommon = entry.grade
    }
  }

  return { total, grades: gradeEntries, mostCommon }
}
