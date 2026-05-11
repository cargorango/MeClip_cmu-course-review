import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getTopCoursesByReviews } from '@/lib/course-ranking'
import { calculateAverageRating } from '@/lib/rating'
import HomeContent from '@/components/home-content'
import FeedbackButton from '@/components/feedback-button'
import LangToggle from '@/components/lang-toggle'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { auth } from '../../auth'
import { translations, type Lang } from '@/lib/i18n'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'

interface HomePageProps {
  searchParams: { q?: string; lang?: string }
}

async function getHomeData() {
  const [courses, freeElectiveCount, faculties] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        nameTh: true,
        ratings: { select: { rating: true } },
      },
    }),
    prisma.course.count({ where: { isFreeElective: true } }),
    prisma.faculty.findMany({ select: { id: true, nameTh: true }, orderBy: { nameTh: 'asc' } }),
  ])
  return { courses, freeElectiveCount, faculties }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth()
  await requireCompleteProfile()

  const { courses, freeElectiveCount, faculties } = await getHomeData()
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

        {/* Home content — global search + discovery */}
        <Suspense fallback={<div className="h-12 animate-pulse bg-gray-100 rounded-lg" />}>
          <HomeContent
            lang={lang}
            faculties={faculties}
            topCourses={topCourses}
            freeElectiveCount={freeElectiveCount}
            initialQuery={initialQuery}
          />
        </Suspense>
      </main>

      <FeedbackButton />
    </div>
  )
}
