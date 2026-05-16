import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { calculateAverageRating } from '@/lib/rating'
import { computeGradeStats } from '@/lib/grade-stats'
import { auth } from '../../../../auth'
import DifficultyRating from '@/components/difficulty-rating'
import ReviewRoom from '@/components/review-room'
import GradeStats from '@/components/grade-stats'
import BookmarkButton from '@/components/bookmark-button'
import ViewLogger from '@/components/view-logger'
import FeedbackButton from '@/components/feedback-button'
import LangToggle from '@/components/lang-toggle'
import { GraduationCap, ArrowLeft, BookOpen } from 'lucide-react'
import { translations, type Lang } from '@/lib/i18n'
import { Suspense } from 'react'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'

interface CoursePageProps {
  params: { courseId: string }
  searchParams: { lang?: string }
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { courseId } = params
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'
  const tr = translations[lang]

  // Run auth + all DB queries in parallel to avoid sequential round trips
  const [session, course, reviewRoomForGrades] = await Promise.all([
    auth(),
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        name: true,
        nameTh: true,
        codeEn: true,
        codeTh: true,
        credits: true,
        description: true,
        descriptionEn: true,
        prerequisite: true,
        department: true,
        updatedDate: true,
        isFreeElective: true,
        facultyId: true,
        ratings: { select: { rating: true, userId: true } },
        faculty: { select: { id: true, name: true, nameTh: true } },
        curriculum: { select: { id: true, programType: true, curriculumYear: true } },
      },
    }),
    // Limit to last 200 messages for grade stats — avoids loading thousands of records
    prisma.reviewRoom.findUnique({
      where: { courseId },
      select: {
        messages: {
          where: { isDeleted: false },
          select: { grade: true },
          orderBy: { createdAt: 'desc' },
          take: 200,
        },
      },
    }).catch(() => null),
  ])

  await requireCompleteProfile()

  if (!course) {
    notFound()
  }

  const messageGrades: (string | null)[] = reviewRoomForGrades?.messages.map(m => m.grade) ?? []

  const ratings = course.ratings.map(r => r.rating)
  const averageRating = calculateAverageRating(ratings)
  const ratingDistribution = {
    one: ratings.filter(r => r === 1).length,
    two: ratings.filter(r => r === 2).length,
    three: ratings.filter(r => r === 3).length,
  }

  const currentUserRating = session?.user?.id
    ? (course.ratings.find(r => r.userId === session.user.id)?.rating ?? null)
    : null

  const gradeStats = computeGradeStats(messageGrades)

  // Fetch bookmark only after we have session (can't run earlier without userId)
  const isBookmarked = session?.user?.id
    ? await prisma.courseBookmark.findUnique({
        where: { courseId_userId: { courseId, userId: session.user.id } },
      }).then(b => !!b).catch(() => false)
    : false

  // Badges: only show codeEn and credits — faculty/curriculum data is unreliable (CSV import artifacts)
  // Do NOT show faculty nameTh or curriculum label as they contain placeholder data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="flex items-center gap-2">
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
                href={`/login?callbackUrl=/course/${courseId}&lang=${lang}`}
                className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {tr.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Fire-and-forget view log */}
        <ViewLogger courseId={courseId} />

        {/* Back button */}
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-blue-300 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {tr.back}
        </Link>

        {/* Course info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="bg-blue-100 rounded-xl p-2.5 shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-600">{course.code}</p>
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{course.nameTh}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{course.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Bookmark button */}
              <BookmarkButton
                courseId={courseId}
                initialBookmarked={isBookmarked}
                isLoggedIn={!!session?.user}
              />
              {/* Department badge — top right */}
              {course.department &&
                course.department !== '-' &&
                !course.department.toLowerCase().includes('csv') &&
                !course.department.toLowerCase().includes('import') && (
                <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                  {course.department}
                </span>
              )}
            </div>
          </div>

          {/* Badges row — codeEn + credits only (faculty/curriculum data unreliable) */}
          <div className="flex flex-wrap gap-2 pt-1">
            {course.codeEn && course.codeEn !== '-' && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {course.codeEn}
              </span>
            )}
            {course.credits && course.credits !== '-' && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {lang === 'en' ? 'Credits' : 'หน่วยกิต'}: {course.credits}
              </span>
            )}
          </div>

          {/* Prerequisite */}
          {course.prerequisite && course.prerequisite !== '-' && (
            <div className="pt-1">
              <span className="text-xs text-gray-500">
                {lang === 'en' ? 'Prerequisite: ' : 'วิชาบังคับก่อน: '}
                <span className="font-medium text-gray-700">{course.prerequisite}</span>
              </span>
            </div>
          )}

          {/* Description Thai */}
          {course.description && course.description !== '-' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {lang === 'en' ? 'Course Description (TH)' : 'คำอธิบายวิชา'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Description English */}
          {course.descriptionEn && course.descriptionEn !== '-' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Course Description (EN)
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{course.descriptionEn}</p>
            </div>
          )}

          {/* Updated date */}
          {course.updatedDate && course.updatedDate !== '-' && (
            <p className="text-xs text-gray-400 pt-1">
              {lang === 'en' ? 'Last updated: ' : 'อัปเดตล่าสุด: '}{course.updatedDate}
            </p>
          )}
        </div>

        {/* Difficulty rating */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{tr.difficulty}</h2>
          <DifficultyRating
            courseId={courseId}
            isLoggedIn={!!session?.user}
            currentRating={currentUserRating}
            averageRating={averageRating}
            totalRatings={ratings.length}
            ratingDistribution={ratingDistribution}
          />
        </div>

        {/* Grade statistics */}
        {gradeStats && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <GradeStats stats={gradeStats} lang={lang} />
          </div>
        )}

        {/* Review room */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{tr.reviewRoom}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{tr.reviewRoomDesc}</p>
          </div>
          <ReviewRoom courseId={courseId} isLoggedIn={!!session?.user} />
        </div>
      </main>

      <FeedbackButton />
    </div>
  )
}
