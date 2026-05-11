import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '../../../auth'
import { prisma } from '@/lib/prisma'
import LangToggle from '@/components/lang-toggle'
import FeedbackButton from '@/components/feedback-button'
import { GraduationCap, ArrowLeft, BookOpen } from 'lucide-react'
import { type Lang } from '@/lib/i18n'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'
import AllCoursesSearch from './all-courses-search'
import { getTopCoursesByLogCount, getCoursesWithReviews } from '@/lib/course-ranking'
import { calculateAverageRating } from '@/lib/rating'

interface PageProps {
  searchParams: { lang?: string; q?: string; dept?: string }
}

async function getDiscoveryData() {
  // Fetch faculties and courses always (these tables exist)
  const [faculties, coursesRaw] = await Promise.all([
    prisma.faculty.findMany({ select: { id: true, nameTh: true }, orderBy: { nameTh: 'asc' } }),
    prisma.course.findMany({
      select: {
        id: true, code: true, name: true, nameTh: true, credits: true, isFreeElective: true,
        faculty: { select: { nameTh: true } },
        ratings: { select: { rating: true } },
        reviewRoom: {
          select: { _count: { select: { messages: { where: { isDeleted: false } } } } },
        },
      },
    }),
  ])

  // Gracefully handle new tables that may not exist yet in production
  let viewCounts: { courseId: string; _count: { courseId: number } }[] = []
  let searchCounts: { courseId: string | null; _count: { courseId: number } }[] = []
  try {
    ;[viewCounts, searchCounts] = await Promise.all([
      prisma.courseViewLog.groupBy({ by: ['courseId'], _count: { courseId: true } }),
      prisma.courseSearchLog.groupBy({ by: ['courseId'], where: { courseId: { not: null } }, _count: { courseId: true } }),
    ])
  } catch {
    // Tables don't exist yet — skip log counts, mostSearched will be empty
  }

  // Build log count map
  const logCountMap = new Map<string, number>()
  for (const row of viewCounts) {
    logCountMap.set(row.courseId, (logCountMap.get(row.courseId) ?? 0) + row._count.courseId)
  }
  for (const row of searchCounts) {
    if (row.courseId) {
      logCountMap.set(row.courseId, (logCountMap.get(row.courseId) ?? 0) + row._count.courseId)
    }
  }

  const enriched = coursesRaw.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    nameTh: c.nameTh,
    credits: c.credits,
    isFreeElective: c.isFreeElective,
    faculty: c.faculty,
    reviewCount: c.reviewRoom?._count.messages ?? 0,
    averageRating: calculateAverageRating(c.ratings.map(r => r.rating)),
    logCount: logCountMap.get(c.id) ?? 0,
  }))

  const mostSearched = getTopCoursesByLogCount(enriched, 20)
  const withReviews = getCoursesWithReviews(enriched).slice(0, 20)

  return { faculties, mostSearched, withReviews }
}

export default async function AllCoursesPage({ searchParams }: PageProps) {
  const session = await auth()
  await requireCompleteProfile()
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'

  const { faculties, mostSearched, withReviews } = await getDiscoveryData()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900 text-sm sm:text-base">CMU Course Review</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <LangToggle currentLang={lang} />
            </Suspense>
            {session?.user ? (
              <UserMenu
                displayName={session.user.displayName ?? session.user.name ?? 'โปรไฟล์'}
                isAdmin={isAdminRole(session.user.role)}
                lang={lang}
              />
            ) : (
              <Link href={`/login?lang=${lang}`} className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                {lang === 'en' ? 'Sign In' : 'เข้าสู่ระบบ'}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link href={`/?lang=${lang}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-blue-300 transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          {lang === 'en' ? 'Back' : 'ย้อนกลับ'}
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-xl p-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lang === 'en' ? 'All Courses' : 'วิชาทั้งหมด'}
            </h1>
            <p className="text-sm text-gray-500">
              {lang === 'en' ? 'Search and discover courses' : 'ค้นหาและสำรวจกระบวนวิชา'}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-12 animate-pulse bg-gray-100 rounded-xl" />}>
          <AllCoursesSearch
            lang={lang}
            initialQ={searchParams.q ?? ''}
            initialDept={searchParams.dept ?? ''}
            faculties={faculties}
            mostSearchedCourses={mostSearched}
            coursesWithReviews={withReviews}
          />
        </Suspense>
      </main>

      <FeedbackButton />
    </div>
  )
}
