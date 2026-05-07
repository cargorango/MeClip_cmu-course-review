import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '../../../auth'
import LangToggle from '@/components/lang-toggle'
import FreeElectiveSearch from '@/components/free-elective-search'
import FeedbackButton from '@/components/feedback-button'
import { GraduationCap, ArrowLeft, BookOpen } from 'lucide-react'
import { type Lang } from '@/lib/i18n'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'

interface PageProps {
  searchParams: { lang?: string; q?: string }
}

export default async function FreeElectivesPage({ searchParams }: PageProps) {
  const session = await auth()
  await requireCompleteProfile()
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'
  const q = searchParams.q ?? ''

  const courses = await prisma.course.findMany({
    where: {
      isFreeElective: true,
      ...(q ? {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { nameTh: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      ratings: { select: { rating: true } },
      faculty: { select: { nameTh: true } },
    },
    orderBy: { code: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Back */}
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-blue-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'en' ? 'Back' : 'ย้อนกลับ'}
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 rounded-xl p-2.5">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lang === 'en' ? 'Free Elective Courses' : 'วิชาเลือกเสรี'}
            </h1>
            <p className="text-sm text-gray-500">{courses.length} {lang === 'en' ? 'courses' : 'วิชา'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <Suspense fallback={<div className="h-11 animate-pulse bg-gray-100 rounded-xl" />}>
            <FreeElectiveSearch initialQuery={q} lang={lang} />
          </Suspense>
        </div>

        {/* Course list */}
        <div className="space-y-2">
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="text-gray-500">{lang === 'en' ? 'No courses found' : 'ไม่พบกระบวนวิชา'}</p>
            </div>
          ) : (
            courses.map(course => {
              const avgRating = course.ratings.length > 0
                ? Math.round(course.ratings.reduce((s, r) => s + r.rating, 0) / course.ratings.length * 10) / 10
                : null

              return (
                <Link
                  key={course.id}
                  href={`/course/${course.id}?lang=${lang}`}
                  prefetch={false}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-purple-600">{course.code}</p>
                        {course.credits && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            {course.credits}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{course.nameTh}</p>
                      <p className="text-xs text-gray-500">{course.name}</p>
                      {course.faculty.nameTh !== 'วิชาเลือกเสรี' && (
                        <p className="text-xs text-gray-400 mt-0.5">{course.faculty.nameTh}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {avgRating !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="text-sm font-semibold text-gray-700">{avgRating}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{lang === 'en' ? 'No rating' : 'ยังไม่มีคะแนน'}</span>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{course.ratings.length} {lang === 'en' ? 'reviews' : 'รีวิว'}</p>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </main>

      <FeedbackButton />
    </div>
  )
}
