import CourseCard from './course-card'
import type { Lang } from '@/lib/i18n'

interface DiscoverySectionProps {
  topCourses: {
    id: string
    code: string
    nameTh: string
    name: string
    credits: string
    faculty: { nameTh: string }
    reviewCount: number
    averageRating: number | null
    isFreeElective: boolean
  }[]
  lang: Lang
  title?: string
}

export default function DiscoverySection({
  topCourses,
  lang,
  title,
}: DiscoverySectionProps) {
  if (topCourses.length === 0) return null

  const sectionTitle =
    title ?? (lang === 'en' ? 'Top Courses' : 'วิชายอดนิยม')

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">{sectionTitle}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            lang={lang}
            showReviewCount
          />
        ))}
      </div>
    </section>
  )
}
