export interface CourseWithCount {
  id: string
  code: string
  name: string
  nameTh: string
  reviewCount: number
}

export function getTopCoursesByReviews<T extends CourseWithCount>(
  courses: T[],
  n: number
): T[] {
  return [...courses]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, n)
}

export interface CourseWithLogCount {
  id: string
  code: string
  nameTh: string
  name: string
  faculty: { nameTh: string }
  logCount: number
}

/**
 * Pure function — returns the top-N courses by logCount descending.
 */
export function getTopCoursesByLogCount<T extends CourseWithLogCount>(
  courses: T[],
  n: number
): T[] {
  return [...courses].sort((a, b) => b.logCount - a.logCount).slice(0, n)
}

export interface CoursesWithReviewsItem {
  id: string
  code: string
  nameTh: string
  name: string
  faculty: { nameTh: string }
  reviewCount: number
  isFreeElective: boolean
}

/**
 * Pure function — returns courses that have at least one review and are not free electives,
 * sorted descending by reviewCount.
 */
export function getCoursesWithReviews<T extends CoursesWithReviewsItem>(courses: T[]): T[] {
  return [...courses]
    .filter((c) => !c.isFreeElective && c.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
}
