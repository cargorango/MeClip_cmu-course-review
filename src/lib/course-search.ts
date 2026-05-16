export interface CourseForSearch {
  id: string
  code: string
  name: string
  nameTh: string
  curriculumId: string
  facultyId: string
}

export function searchCourses<T extends CourseForSearch>(
  courses: T[],
  query: string
): T[] {
  if (!query.trim()) return courses
  const lowerQuery = query.toLowerCase()
  const isNumeric = /^\d+$/.test(query)
  if (isNumeric) {
    return courses.filter(course => course.code.toLowerCase().startsWith(lowerQuery))
  }
  return courses.filter(
    course =>
      course.code.toLowerCase().includes(lowerQuery) ||
      course.name.toLowerCase().includes(lowerQuery) ||
      course.nameTh.toLowerCase().includes(lowerQuery)
  )
}
