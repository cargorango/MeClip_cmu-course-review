import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '../../../auth'
import LangToggle from '@/components/lang-toggle'
import FeedbackButton from '@/components/feedback-button'
import { GraduationCap, ArrowLeft, BookOpen, ArrowRight } from 'lucide-react'
import { type Lang } from '@/lib/i18n'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'
import FreeElectiveSearchV2 from './free-elective-search-v2'
import { calculateAverageRating } from '@/lib/rating'

interface PageProps {
  searchParams: { lang?: string; q?: string }
}

export default async function FreeElectivesPage({ searchParams }: PageProps) {
  const session = await auth()
  await requireCompleteProfile()
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'

  const [faculties, coursesRaw, totalCount] = await Promise.all([
    prisma.faculty.findMany({ select: { id: true, name: true, nameTh: true }, orderBy: { nameTh: 'asc' } }),
    prisma.course.findMany({
      where: { isFreeElective: true },
      select: {
        id: true, code: true, name: true, nameTh: true, credits: true, isFreeElective: true,
        faculty: { select: { nameTh: true, id: true } },
        ratings: { select: { rating: true } },
        reviewRoom: {
          select: { _count: { select: { messages: { where: { isDeleted: false } } } } },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.course.count({ where: { isFreeElective: true } }),
  ])

  const topFreeElectives = coursesRaw
    .map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nameTh: c.nameTh,
      credits: c.credits,
      isFreeElective: c.isFreeElective,
      faculty: { nameTh: c.faculty.nameTh },
      reviewCount: c.reviewRoom?._count.messages ?? 0,
      averageRating: calculateAverageRating(c.ratings.map(r => r.rating)),
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)

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

        {/* Title row with "ดูวิชาทั้งหมด" shortcut */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-xl p-2.5">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'en' ? 'Free Elective Courses' : 'วิชาเลือกเสรี'}
              </h1>
              <p className="text-sm text-gray-500">{totalCount} {lang === 'en' ? 'courses' : 'วิชา'}</p>
            </div>
          </div>
          {/* Shortcut to all courses */}
          <Link
            href={`/courses?lang=${lang}`}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            {lang === 'en' ? 'All Courses' : 'ดูวิชาทั้งหมด'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search + results */}
        <Suspense fallback={<div className="h-12 animate-pulse bg-gray-100 rounded-xl" />}>
          <FreeElectiveSearchV2
            lang={lang}
            faculties={faculties}
            topFreeElectives={topFreeElectives}
          />
        </Suspense>
      </main>

      <FeedbackButton />
    </div>
  )
}
