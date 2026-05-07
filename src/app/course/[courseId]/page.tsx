import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { calculateAverageRating } from '@/lib/rating'
import { auth } from '../../../../auth'
import DifficultyRating from '@/components/difficulty-rating'
import ReviewRoom from '@/components/review-room'
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
  const session = await auth()
  await requireCompleteProfile()
  const { courseId } = params
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'
  const tr = translations[lang]

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      ratings: { select: { rating: true, userId: true } },
      faculty: { select: { id: true, name: true, nameTh: true } },
      curriculum: { select: { id: true, programType: true, curriculumYear: true } },
    },
  })

  if (!course) {
    notFound()
  }

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

  // Only show curriculum label if it's a real curriculum (not auto-generated placeholders)
  const AUTO_CURRICULUM_IDS = ['curriculum-free-elective', 'curriculum-general']
  const isRealCurriculum = course.curriculum && !AUTO_CURRICULUM_IDS.includes(course.curriculum.id)
  const programTypeLabel = isRealCurriculum && course.curriculum?.programType === 'REGULAR'
    ? (lang === 'en' ? 'Regular' : 'ภาคปกติ')
    : (lang === 'en' ? 'International' : 'นานาชาติ')
  const curriculumLabel = isRealCurriculum
    ? `${programTypeLabel} ${course.curriculum!.curriculumYear}`
    : null

  // Only show faculty if it's a real faculty (not auto-generated)
  const AUTO_FACULTY_IDS = ['faculty-free-elective', 'faculty-general']
  const showFaculty = !AUTO_FACULTY_IDS.includes(course.faculty.id)

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
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-xl p-2.5 shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-600">{course.code}</p>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{course.nameTh}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{course.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {showFaculty && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                {course.faculty.nameTh}
              </span>
            )}
            {curriculumLabel && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                {curriculumLabel}
              </span>
            )}
            {course.credits && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {lang === 'en' ? 'Credits' : 'หน่วยกิต'}: {course.credits}
              </span>
            )}
          </div>
          {course.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {lang === 'en' ? 'Course Description' : 'คำอธิบายวิชา'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{course.description}</p>
            </div>
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
