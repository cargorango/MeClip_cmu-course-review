import { GradeValue } from './grade-stats'

export interface CourseForSort {
  id: string
  code: string
  reviewCount: number
  gradeProportions: Record<GradeValue, number> // 0.0–1.0
}

/**
 * Pure function — sorts courses by reviewCount descending.
 */
export function sortByReviews<T extends CourseForSort>(courses: T[]): T[] {
  return [...courses].sort((a, b) => b.reviewCount - a.reviewCount)
}

/**
 * Pure function — sorts courses by gradeProportions[grade] descending.
 */
export function sortByGrade<T extends CourseForSort>(courses: T[], grade: GradeValue): T[] {
  return [...courses].sort(
    (a, b) => (b.gradeProportions[grade] ?? 0) - (a.gradeProportions[grade] ?? 0)
  )
}

/**
 * Pure function — sorts courses by code ascending (lexicographic).
 */
export function sortByCode<T extends { code: string }>(courses: T[]): T[] {
  return [...courses].sort((a, b) => a.code.localeCompare(b.code))
}
