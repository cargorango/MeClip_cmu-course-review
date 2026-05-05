export interface CourseForFilter {
  id: string
  code: string
  name: string
  nameTh: string
  curriculumId: string
  facultyId: string
}

export function filterByCurriculum<T extends CourseForFilter>(
  courses: T[],
  curriculumId: string
): T[] {
  return courses.filter(course => course.curriculumId === curriculumId)
}
