import { redirect } from 'next/navigation'
import { auth, signOut } from '../../../auth'
import { prisma } from '@/lib/prisma'
import { calculateReviewerLevel } from '@/lib/reviewer-level'
import { formatStatus } from '@/lib/status-formatter'
import Link from 'next/link'
import { GraduationCap, LogOut, User } from 'lucide-react'
import ProfileForm from './profile-form'
import FeedbackButton from '@/components/feedback-button'
import CourseCard from '@/components/course-card'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ratings: {
        include: {
          course: { select: { id: true, code: true, nameTh: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Fetch bookmarks
  const bookmarks = await prisma.courseBookmark.findMany({
    where: { userId: user.id },
    include: {
      course: {
        select: {
          id: true, code: true, nameTh: true, name: true, credits: true, isFreeElective: true,
          faculty: { select: { nameTh: true } },
          reviewRoom: {
            select: { _count: { select: { messages: { where: { isDeleted: false } } } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const uniqueCoursesReviewed = new Set(user.ratings.map(r => r.courseId)).size
  const reviewerLevel = calculateReviewerLevel(uniqueCoursesReviewed)

  const LEVEL_COLORS: Record<string, string> = {
    'น้องใหม่': 'bg-green-100 text-green-700',
    'มีประสบการณ์': 'bg-blue-100 text-blue-700',
    'ตำนานมหาลัย': 'bg-purple-100 text-purple-700',
  }

  const RATING_LABELS: Record<number, string> = {
    1: '😊 ง่าย',
    2: '😐 กลาง',
    3: '😰 ยาก',
  }

  const statusDisplay = user.status
    ? formatStatus({
        status: user.status,
        degreeLevel: user.degreeLevel,
        yearOfStudy: user.yearOfStudy,
        faculty: user.faculty,
        alumniYear: user.alumniYear,
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900">CMU Course Review</span>
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <span className={`ml-auto text-sm px-3 py-1 rounded-full font-medium ${LEVEL_COLORS[reviewerLevel] ?? 'bg-gray-100 text-gray-600'}`}>
              {reviewerLevel}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            รีวิวแล้ว <span className="font-semibold text-gray-800">{uniqueCoursesReviewed}</span> วิชา
          </div>
          {statusDisplay && (
            <div className="text-sm text-gray-500">
              สถานะ: <span className="font-semibold text-gray-800">{statusDisplay}</span>
            </div>
          )}
        </div>

        {/* Edit profile form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">แก้ไขโปรไฟล์</h2>
          <ProfileForm
            displayName={user.displayName}
            isAnonymous={user.isAnonymous}
            status={user.status ?? null}
            yearOfStudy={user.yearOfStudy ?? null}
            degreeLevel={user.degreeLevel ?? null}
            faculty={user.faculty ?? null}
            alumniYear={user.alumniYear ?? null}
          />
        </div>

        {/* Review history */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">ประวัติการรีวิว</h2>
          {user.ratings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีประวัติการรีวิว</p>
          ) : (
            <div className="space-y-2">
              {user.ratings.map(r => (
                <Link
                  key={r.id}
                  href={`/course/${r.courseId}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.course.nameTh}</p>
                    <p className="text-xs text-gray-500">{r.course.code}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{RATING_LABELS[r.rating]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarks — วิชาที่สนใจ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">วิชาที่สนใจ</h2>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีวิชาที่บันทึกไว้</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {bookmarks.map(b => (
                <CourseCard
                  key={b.id}
                  course={{
                    id: b.course.id,
                    code: b.course.code,
                    nameTh: b.course.nameTh,
                    name: b.course.name,
                    credits: b.course.credits,
                    faculty: b.course.faculty,
                    reviewCount: b.course.reviewRoom?._count.messages ?? 0,
                    averageRating: null,
                    isFreeElective: b.course.isFreeElective,
                  }}
                  lang="th"
                  showReviewCount
                  showFreeElectiveTag={b.course.isFreeElective}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <FeedbackButton />
    </div>
  )
}
