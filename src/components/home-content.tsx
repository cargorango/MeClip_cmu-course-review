'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { BookOpen, Loader2 } from 'lucide-react'
import { type Lang, translations } from '@/lib/i18n'
import SearchFilters, { type SearchFilterState } from '@/components/search-filters'
import CourseCard from '@/components/course-card'
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

interface CourseResult {
  id: string
  code: string
  name: string
  nameTh: string
  credits: string
  faculty: { nameTh: string }
  reviewCount: number
  averageRating: number | null
  isFreeElective: boolean
}

interface HomeContentProps {
  lang: Lang
  faculties: { id: string; nameTh: string }[]
  topCourses: TopCourse[]
  freeElectiveCount: number
  initialQuery: string
}

const PAGE_SIZE = 10

export default function HomeContent({
  lang,
  faculties,
  topCourses,
  freeElectiveCount,
  initialQuery,
}: HomeContentProps) {
  const tr = translations[lang]
  const [results, setResults] = useState<CourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasActiveFilter, setHasActiveFilter] = useState(!!initialQuery)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const fetchCourses = useCallback(async (filters: SearchFilterState) => {
    const isActive = !!(filters.q || filters.facultyId || filters.credits || filters.sort)
    setHasActiveFilter(isActive)

    if (!isActive) {
      setResults([])
      setVisibleCount(PAGE_SIZE)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.q) params.set('q', filters.q)
      if (filters.facultyId) params.set('facultyId', filters.facultyId)
      if (filters.credits) params.set('credits', filters.credits)
      if (filters.sort) params.set('sort', filters.sort)
      params.set('page', '1')

      const res = await fetch(`/api/courses/all?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.courses ?? [])
        setVisibleCount(PAGE_SIZE)
      }

      // Fire-and-forget search log
      if (filters.q && filters.q.length >= 2) {
        fetch('/api/logs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: filters.q }),
        }).catch(() => {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const visibleResults = results.slice(0, visibleCount)
  const hasMoreResults = results.length > visibleCount

  return (
    <>
      {/* Global search with filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <SearchFilters
          lang={lang}
          faculties={faculties}
          onFilterChange={fetchCourses}
          initialState={{ q: initialQuery }}
          focusColor="blue"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          {lang === 'en' ? 'Searching...' : 'กำลังค้นหา...'}
        </div>
      )}

      {/* Search results */}
      {hasActiveFilter && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {lang === 'en' ? `Found ${results.length} courses` : `พบ ${results.length} วิชา`}
          </p>
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="text-gray-500">{lang === 'en' ? 'No courses found' : 'ไม่พบกระบวนวิชา'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {visibleResults.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    lang={lang}
                    showReviewCount
                  />
                ))}
              </div>
              {hasMoreResults && (
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="w-full py-2.5 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  {lang === 'en' ? 'Load More' : 'โหลดเพิ่มเติม'} ({results.length - visibleCount} {lang === 'en' ? 'remaining' : 'รายการที่เหลือ'})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Discovery section — shown when no filter active */}
      {!hasActiveFilter && !loading && (
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
      )}
    </>
  )
}
