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
