'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { type Lang, translations } from '@/lib/i18n'
import SearchFilters, { type SearchFilterState } from '@/components/search-filters'
import TopCourses from '@/components/top-courses'

interface TopCourse {
  id: string
  code: string
  name: string
  nameTh: string
  reviewCount: number
  averageRating: number | null
  totalRatings: number
}

interface HomeContentProps {
  lang: Lang
  faculties: { id: string; nameTh: string }[]
  topCourses: TopCourse[]
  freeElectiveCount: number
  initialQuery: string
}

export default function HomeContent({
  lang,
  faculties,
  topCourses,
  freeElectiveCount,
  initialQuery,
}: HomeContentProps) {
  const tr = translations[lang]
  const router = useRouter()

  // When any filter changes, redirect to /courses with all filter params in URL
  const handleFilterChange = (filters: SearchFilterState) => {
    const isActive = !!(filters.q || filters.dept || filters.credits || filters.grade || filters.sort)
    if (!isActive) return

    const params = new URLSearchParams()
    params.set('lang', lang)
    if (filters.q) params.set('q', filters.q)
    if (filters.dept) params.set('dept', filters.dept)
    if (filters.credits) params.set('credits', filters.credits)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.grade) params.set('grade', filters.grade)

    router.push(`/courses?${params.toString()}`)
  }

  return (
    <>
      {/* Global search with filters — redirects to /courses */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <SearchFilters
          lang={lang}
          faculties={faculties}
          onFilterChange={handleFilterChange}
          initialState={{ q: initialQuery }}
          focusColor="blue"
        />
      </div>

      {/* Discovery section — always shown on home page */}
      <>
        {/* All courses link */}
        <Link
          href={`/courses?lang=${lang}`}
          className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-xl p-2.5">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {lang === 'en' ? 'All Courses' : 'วิชาทั้งหมด'}
              </p>
              <p className="text-sm text-gray-500">
                {lang === 'en' ? 'Search all courses' : 'ค้นหาวิชาทั้งหมดในระบบ'}
              </p>
            </div>
          </div>
          <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        {/* Free elective tab */}
        {freeElectiveCount > 0 && (
          <Link
            href={`/free-electives?lang=${lang}`}
            className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-xl p-2.5">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {lang === 'en' ? 'Free Elective Courses' : 'วิชาเลือกเสรี'}
                </p>
                <p className="text-sm text-gray-500">
                  {freeElectiveCount} {lang === 'en' ? 'courses available' : 'วิชา'}
                </p>
              </div>
            </div>
            <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}

        {/* Top courses */}
        {topCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <TopCourses
              courses={topCourses}
              lang={lang}
              labels={{ topCourses: tr.topCourses, reviews: tr.reviews }}
            />
          </div>
        )}
      </>
    </>
  )
}
