export interface CourseForFilterV2 {
  id: string
  code: string
  facultyId: string
  credits: string
}

/**
 * Pure function — filters courses by facultyId.
 * Returns all courses when facultyId is empty string.
 */
export function filterByFaculty<T extends CourseForFilterV2>(courses: T[], facultyId: string): T[] {
  if (facultyId === '') return courses
  return courses.filter((c) => c.facultyId === facultyId)
}

/**
 * Pure function — filters courses by credits.
 * Returns all courses when credits is empty string.
 * Supports both exact match (from dropdown) and prefix match (from text input).
 */
export function filterByCredits<T extends CourseForFilterV2>(courses: T[], credits: string): T[] {
  if (credits === '') return courses
  // Exact match first (for dropdown selection like "3(3-0-6)")
  // Then prefix match (for text input like "3")
  return courses.filter((c) => c.credits === credits || c.credits.startsWith(credits))
}

/**
 * Pure function — filters courses by both facultyId AND credits (intersection).
 * Returns all courses when both are empty strings.
 */
export function filterByFacultyAndCredits<T extends CourseForFilterV2>(
  courses: T[],
  facultyId: string,
  credits: string
): T[] {
  return filterByCredits(filterByFaculty(courses, facultyId), credits)
}
