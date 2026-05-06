import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { type Lang, t } from '@/lib/i18n'

interface TopCourse {
  id: string
  code: string
  name: string
  nameTh: string
  averageRating: number | null
  totalRatings: number
}

interface TopCoursesProps {
  courses: TopCourse[]
  lang?: Lang
}

export default function TopCourses({ courses, lang = 'th' }: TopCoursesProps) {
  if (courses.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-orange-500" />
        <h2 className="text-sm font-semibold text-gray-700">{t(lang, 'topCourses')}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {courses.map((course, index) => (
          <Link
            key={course.id}
            href={`/course/${course.id}?lang=${lang}`}
            prefetch={true}
            className="block p-4 bg-gradient-to-br from-white to-orange-50 border border-orange-100 rounded-xl hover:shadow-md hover:border-orange-300 transition-all"
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{medals[index]}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-orange-600">{course.code}</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{course.nameTh}</p>
                <div className="flex items-center gap-2 mt-1">
                  {course.averageRating !== null && (
                    <span className="text-xs text-gray-600">★ {course.averageRating}</span>
                  )}
                  <span className="text-xs text-gray-400">{course.totalRatings} {t(lang, 'reviews')}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
