import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getTopCoursesByReviews } from '@/lib/course-ranking'
import { calculateAverageRating } from '@/lib/rating'
import CourseSearch from '@/components/course-search'
import TopCourses from '@/components/top-courses'
import FeedbackButton from '@/components/feedback-button'
import LangToggle from '@/components/lang-toggle'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { auth } from '../../auth'
import { type Lang, t } from '@/lib/i18n'

interface HomePageProps {
  searchParams: { q?: string; lang?: string }
}

async function getHomeData() {
  const courses = await prisma.course.findMany({
    include: {
      ratings: { select: { rating: true } },
    },
  })
  return { courses }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth()
  const { courses } = await getHomeData()
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'

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
              {t(lang, 'appName')}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <LangToggle currentLang={lang} />
            </Suspense>
            {session?.user ? (
              <Link
                href={`/profile?lang=${lang}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {session.user.displayName ?? session.user.name ?? t(lang, 'profile')}
              </Link>
            ) : (
              <Link
                href={`/login?lang=${lang}`}
                className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t(lang, 'login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t(lang, 'heroTitle')}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {t(lang, 'appDesc')}
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

        {/* Top courses */}
        {topCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <TopCourses courses={topCourses} lang={lang} />
          </div>
        )}
      </main>

      <FeedbackButton />
    </div>
  )
}
