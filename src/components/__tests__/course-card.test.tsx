// Feature: thai-faculty-performance — Task 3.1
// Unit tests for CourseCard faculty name display
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CourseCard from '../course-card'

// Minimal course fixture factory
function makeCourse(overrides: Partial<Parameters<typeof CourseCard>[0]['course']> = {}) {
  return {
    id: 'course-1',
    code: '261101',
    nameTh: 'วิชาทดสอบ',
    name: 'Test Course',
    credits: '3',
    faculty: null,
    department: null,
    reviewCount: 0,
    averageRating: null,
    isFreeElective: false,
    ...overrides,
  }
}

describe('CourseCard — faculty name display', () => {
  // ── Requirement 1.1: Thai mode with known faculty name ────────────────────

  it('displays Thai faculty name when lang="th" and faculty name is in the translation map', () => {
    const course = makeCourse({
      faculty: { nameTh: 'Faculty of Engineering' },
    })
    render(<CourseCard course={course} lang="th" />)
    expect(screen.getByText('คณะวิศวกรรมศาสตร์')).toBeInTheDocument()
  })

  it('displays Thai faculty name for Faculty of Science when lang="th"', () => {
    const course = makeCourse({
      faculty: { nameTh: 'Faculty of Science' },
    })
    render(<CourseCard course={course} lang="th" />)
    expect(screen.getByText('คณะวิทยาศาสตร์')).toBeInTheDocument()
  })

  it('displays Thai faculty name for College of Arts, Media and Technology when lang="th"', () => {
    const course = makeCourse({
      faculty: { nameTh: 'College of Arts, Media and Technology' },
    })
    render(<CourseCard course={course} lang="th" />)
    expect(screen.getByText('วิทยาลัยศิลปะ สื่อ และเทคโนโลยี')).toBeInTheDocument()
  })

  // ── Requirement 1.2: English mode returns original name ───────────────────

  it('displays English faculty name unchanged when lang="en"', () => {
    const course = makeCourse({
      faculty: { nameTh: 'Faculty of Engineering' },
    })
    render(<CourseCard course={course} lang="en" />)
    expect(screen.getByText('Faculty of Engineering')).toBeInTheDocument()
  })

  it('does not display Thai name when lang="en"', () => {
    const course = makeCourse({
      faculty: { nameTh: 'Faculty of Engineering' },
    })
    render(<CourseCard course={course} lang="en" />)
    expect(screen.queryByText('คณะวิศวกรรมศาสตร์')).not.toBeInTheDocument()
  })

  // ── Requirement 1.3: Fallback for unknown faculty name ────────────────────

  it('displays original name as fallback when lang="th" and faculty name is not in the map', () => {
    const course = makeCourse({
      faculty: { nameTh: 'Unknown Faculty XYZ' },
    })
    render(<CourseCard course={course} lang="th" />)
    expect(screen.getByText('Unknown Faculty XYZ')).toBeInTheDocument()
  })

  // ── No faculty: nothing rendered ──────────────────────────────────────────

  it('does not render faculty section when faculty is null', () => {
    const course = makeCourse({ faculty: null })
    const { container } = render(<CourseCard course={course} lang="th" />)
    // No faculty text should appear — just course name/code
    expect(screen.queryByText('คณะวิศวกรรมศาสตร์')).not.toBeInTheDocument()
    expect(container).toBeTruthy()
  })

  it('does not render faculty section when faculty is undefined', () => {
    const course = makeCourse({ faculty: undefined })
    render(<CourseCard course={course} lang="th" />)
    expect(screen.queryByText('คณะวิศวกรรมศาสตร์')).not.toBeInTheDocument()
  })
})
