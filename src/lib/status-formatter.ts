export type DegreeLevel = 'BACHELOR' | 'MASTER' | 'DOCTORAL'
export type UserStatus = 'STUDENT' | 'TEACHER' | 'ALUMNI'

export interface StatusFormatterInput {
  status?: UserStatus | string | null
  degreeLevel?: DegreeLevel | string | null
  yearOfStudy?: number | null
  faculty?: string | null
  alumniYear?: number | null
}

const DEGREE_LABELS: Record<string, string> = {
  BACHELOR: 'ป.ตรี',
  MASTER: 'ป.โท',
  DOCTORAL: 'ป.เอก',
}

/**
 * Pure function — formats user status into a Thai display string.
 * Never throws, never returns an empty string.
 *
 * Examples:
 *   STUDENT + BACHELOR + year=3  → "นักศึกษา ป.ตรี ปี3"
 *   STUDENT + MASTER   + year=1  → "นักศึกษา ป.โท ปี1"
 *   STUDENT + no degree + year=2 → "นักศึกษา ปี2"
 *   STUDENT + no degree + no year → "นักศึกษา"
 *   TEACHER + faculty="วิศวะ"    → "อาจารย์ วิศวะ"
 *   ALUMNI  + alumniYear=65      → "ศิษย์เก่า ปี65"
 */
export function formatStatus(input: StatusFormatterInput): string {
  const { status, degreeLevel, yearOfStudy, faculty, alumniYear } = input

  if (status === 'STUDENT') {
    const degreeLabel = degreeLevel ? (DEGREE_LABELS[degreeLevel] ?? null) : null
    if (degreeLabel && yearOfStudy != null) {
      return `นักศึกษา ${degreeLabel} ปี${yearOfStudy}`
    }
    if (degreeLabel) {
      return `นักศึกษา ${degreeLabel}`
    }
    if (yearOfStudy != null) {
      return `นักศึกษา ปี${yearOfStudy}`
    }
    return 'นักศึกษา'
  }

  if (status === 'TEACHER') {
    if (faculty && faculty.trim()) {
      return `อาจารย์ ${faculty.trim()}`
    }
    return 'อาจารย์'
  }

  if (status === 'ALUMNI') {
    if (alumniYear != null) {
      return `ศิษย์เก่า ปี${alumniYear}`
    }
    return 'ศิษย์เก่า'
  }

  // Fallback for unknown/null status — never return empty string
  return 'ไม่ระบุตัวตน'
}

/**
 * Pure function — formats user status into an anonymous Thai label string.
 * Used for displaying reviewer identity without revealing personal details.
 * Never throws, never returns an empty string.
 *
 * Format rules:
 *   STUDENT + faculty + year  → "นักศึกษาคณะ [faculty] ชั้นปี [year]"
 *   STUDENT + faculty only    → "นักศึกษาคณะ [faculty]"
 *   STUDENT + year only       → "นักศึกษา ชั้นปี [year]"
 *   STUDENT + neither         → "นักศึกษา"
 *   TEACHER + faculty         → "อาจารย์คณะ [faculty]"
 *   TEACHER + no faculty      → "อาจารย์"
 *   ALUMNI  + alumniYear      → "ศิษย์เก่ารุ่น [alumniYear]"
 *   ALUMNI  + no alumniYear   → "ศิษย์เก่า"
 */
export function formatAnonymousLabel(
  status: UserStatus | string | null | undefined,
  faculty?: string | null,
  yearOfStudy?: number | null,
  alumniYear?: number | null
): string {
  const facultyTrimmed = faculty?.trim() || null

  if (status === 'STUDENT') {
    if (facultyTrimmed && yearOfStudy != null) {
      return `นักศึกษาคณะ ${facultyTrimmed} ชั้นปี ${yearOfStudy}`
    }
    if (facultyTrimmed) {
      return `นักศึกษาคณะ ${facultyTrimmed}`
    }
    if (yearOfStudy != null) {
      return `นักศึกษา ชั้นปี ${yearOfStudy}`
    }
    return 'นักศึกษา'
  }

  if (status === 'TEACHER') {
    if (facultyTrimmed) {
      return `อาจารย์คณะ ${facultyTrimmed}`
    }
    return 'อาจารย์'
  }

  if (status === 'ALUMNI') {
    if (alumniYear != null) {
      return `ศิษย์เก่ารุ่น ${alumniYear}`
    }
    return 'ศิษย์เก่า'
  }

  return 'ไม่ระบุตัวตน'
}
