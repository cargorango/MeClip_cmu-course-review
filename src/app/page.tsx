import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getTopCoursesByReviews } from '@/lib/course-ranking'
import { calculateAverageRating } from '@/lib/rating'
import CurriculumFilter, { CurriculumOption } from '@/components/curriculum-filter'
import CourseSearch from '@/components/course-search'
import TopCourses from '@/components/top-courses'
import FeedbackButton from '@/components/feedback-button'
import Link from 'next/link'
import { BookOpen, GraduationCap } from 'lucide-react'
import { auth } from '../../auth'

interface HomePageProps {
  searchParams: { curriculum?: string; q?: string; faculty?: string }
}

async function getHomeData() {
  const [curricula, courses, faculties] = await Promise.all([
    prisma.curriculum.findMany({
      include: { faculty: { select: { id: true, name: true, nameTh: true } } },
      orderBy: [{ programType: 'asc' }, { curriculumYear: 'asc' }],
    }),
    prisma.course.findMany({
      include: {
        ratings: { select: { rating: true } },
        faculty: { select: { id: true, name: true, nameTh: true } },
      },
    }),
    prisma.faculty.findMany({
      include: { courses: { select: { id: true } } },
    }),
  ])

  return { curricula, courses, faculties }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth()
  const { curricula, courses, faculties } = await getHomeData()

  // Build curriculum options
  const curriculumOptions: CurriculumOption[] = curricula.map(c => ({
    id: c.id,
    label: `${c.faculty.nameTh} - ${c.programType === 'REGULAR' ? 'ภาคปกติ' : 'นานาชาติ'} ${c.curriculumYear}`,
    programType: c.programType as 'REGULAR' | 'INTERNATIONAL',
    curriculumYear: c.curriculumYear,
  }))

  // Top 3 most-reviewed courses
  const coursesWithCount = courses.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    nameTh: c.nameTh,
    reviewCount: c.ratings.length,
    averageRating: calculateAverageRating(c.ratings.map(r => r.rating)),
    totalRatings: c.ratings.length,
  }))
  const topCourses = getTopCoursesByReviews(coursesWithCount, 3)

  // Faculty filter: show only when more than 1 faculty has courses
  const facultiesWithCourses = faculties.filter(f => f.courses.length > 0)
  const showFacultyFilter = facultiesWithCourses.length > 1

  const selectedCurriculum = searchParams.curriculum ?? ''
  const initialQuery = searchParams.q ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900">CMU Course Review</span>
          </Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {session.user.displayName ?? session.user.name ?? 'โปรไฟล์'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            รีวิวกระบวนวิชา มช.
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            ค้นหาและรีวิวกระบวนวิชาของมหาวิทยาลัยเชียงใหม่
          </p>
        </div>

        {/* Faculty filter (only when > 1 faculty) */}
        {showFacultyFilter && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              เลือกคณะ
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  !searchParams.faculty
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                ทั้งหมด
              </Link>
              {facultiesWithCourses.map(f => (
                <Link
                  key={f.id}
                  href={`/?faculty=${f.id}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    searchParams.faculty === f.id
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {f.nameTh}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Curriculum filter */}
        {curriculumOptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded-lg" />}>
              <CurriculumFilter
                options={curriculumOptions}
                selectedId={selectedCurriculum}
              />
            </Suspense>
          </div>
        )}

        {/* Course search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <Suspense fallback={<div className="h-12 animate-pulse bg-gray-100 rounded-lg" />}>
            <CourseSearch
              initialQuery={initialQuery}
              curriculumId={selectedCurriculum}
            />
          </Suspense>
        </div>

        {/* Top courses */}
        {topCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <TopCourses courses={topCourses} />
          </div>
        )}
      </main>

      <FeedbackButton />
    </div>
  )
}
