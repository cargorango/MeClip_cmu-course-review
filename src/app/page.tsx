import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getTopCoursesByReviews } from '@/lib/course-ranking'
import { calculateAverageRating } from '@/lib/rating'
import CourseSearch from '@/components/course-search'
import TopCourses from '@/components/top-courses'
import FeedbackButton from '@/components/feedback-button'
import LangToggle from '@/components/lang-toggle'
import Link from 'next/link'
import { GraduationCap, BookOpen } from 'lucide-react'
import { auth } from '../../auth'
import { translations, type Lang } from '@/lib/i18n'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'

interface HomePageProps {
  searchParams: { q?: string; lang?: string }
}

async function getHomeData() {
  const [courses, freeElectiveCount] = await Promise.all([
    prisma.course.findMany({
      include: { ratings: { select: { rating: true } } },
    }),
    prisma.course.count({ where: { isFreeElective: true } }),
  ])
  return { courses, freeElectiveCount }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth()

  // Check DB directly — redirect to onboarding if profile incomplete
  await requireCompleteProfile()

  const { courses, freeElectiveCount } = await getHomeData()
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'
  const tr = translations[lang]

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

  const initialQuery = searchParams.q ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900 text-sm sm:text-base">
              {tr.appName}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <LangToggle currentLang={lang} />
            </Suspense>
            {session?.user ? (
              <UserMenu
                displayName={session.user.displayName ?? session.user.name ?? tr.profile}
                isAdmin={isAdminRole(session.user.role)}
                lang={lang}
              />
            ) : (
              <Link
                href={`/login?lang=${lang}`}
                className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {tr.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {tr.heroTitle}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {tr.appDesc}
          </p>
        </div>

        {/* Course search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <Suspense fallback={<div className="h-12 animate-pulse bg-gray-100 rounded-lg" />}>
            <CourseSearch
              initialQuery={initialQuery}
              lang={lang}
            />
          </Suspense>
        </div>

        {/* All courses link — above free elective */}
        <Link
          href={`/courses?lang=${lang}`}
          className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-xl p-2.5">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {lang === 'en' ? 'All Courses' : 'วิชาทั้งหมด'}
              </p>
              <p className="text-sm text-gray-500">
                {lang === 'en' ? 'Search all courses' : 'ค้นหาวิชาทั้งหมดในระบบ'}
              </p>
            </div>
          </div>
          <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        {/* Free elective tab */}
        {freeElectiveCount > 0 && (
          <Link
            href={`/free-electives?lang=${lang}`}
            className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-xl p-2.5">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {lang === 'en' ? 'Free Elective Courses' : 'วิชาเลือกเสรี'}
                </p>
                <p className="text-sm text-gray-500">
                  {freeElectiveCount} {lang === 'en' ? 'courses available' : 'วิชา'}
                </p>
              </div>
            </div>
            <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}

        {/* Top courses */}
        {topCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <TopCourses
              courses={topCourses}
              lang={lang}
              labels={{ topCourses: tr.topCourses, reviews: tr.reviews }}
            />
          </div>
        )}
      </main>

      <FeedbackButton />
    </div>
  )
}
