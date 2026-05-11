import Link from 'next/link'
import { Star } from 'lucide-react'
import type { Lang } from '@/lib/i18n'

interface CourseCardProps {
  course: {
    id: string
    code: string
    nameTh: string
    name: string
    credits: string
    faculty: { nameTh: string }
    reviewCount: number
    averageRating: number | null
    isFreeElective: boolean
  }
  lang: Lang
  showFreeElectiveTag?: boolean
  showReviewCount?: boolean
}

export default function CourseCard({
  course,
  lang,
  showFreeElectiveTag = false,
  showReviewCount = false,
}: CourseCardProps) {
  return (
    <Link
      href={`/course/${course.id}?lang=${lang}`}
      className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Course code */}
          <p className="text-sm font-semibold text-blue-600">{course.code}</p>

          {/* Thai name */}
          <p className="text-sm font-bold text-gray-900 line-clamp-2 mt-0.5">
            {course.nameTh}
          </p>

          {/* English name */}
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{course.name}</p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Credits badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {course.credits} หน่วยกิต
            </span>

            {/* Faculty badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {course.faculty.nameTh}
            </span>

            {/* Free elective tag */}
            {showFreeElectiveTag && course.isFreeElective && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                วิชาเลือกเสรี
              </span>
            )}
          </div>
        </div>

        {/* Right side: rating + review count */}
        <div className="shrink-0 text-right">
          {course.averageRating !== null ? (
            <div className="flex items-center gap-1 justify-end">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">
                {course.averageRating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              {lang === 'en' ? 'No rating' : 'ยังไม่มีคะแนน'}
            </span>
          )}

          {showReviewCount && (
            <p className="text-xs text-gray-400 mt-0.5">
              {course.reviewCount} {lang === 'en' ? 'reviews' : 'รีวิว'}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
