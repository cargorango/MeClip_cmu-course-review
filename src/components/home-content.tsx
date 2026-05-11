'use client'

import { useState, useCallback, useRef } from 'react'
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
  faculty: { nameTh: string } | null
  department?: string | null
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
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFilters, setCurrentFilters] = useState<SearchFilterState | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasActiveFilter, setHasActiveFilter] = useState(!!initialQuery)

  const buildParams = (filters: SearchFilterState, page: number) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.dept === 'FREE_ELECTIVE') {
      params.set('isFreeElective', 'true')
    } else if (filters.dept) {
      params.set('dept', filters.dept)
    }
    if (filters.credits) params.set('credits', filters.credits)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.grade) params.set('grade', filters.grade)
    params.set('page', String(page))
    return params
  }

  const fetchCourses = useCallback(async (filters: SearchFilterState) => {
    // Active = any filter has a value (q is NOT required)
    const isActive = !!(filters.q || filters.dept || filters.credits || filters.grade || filters.sort)
    setHasActiveFilter(isActive)

    if (!isActive) {
      setResults([])
      setTotalCount(0)
      setCurrentPage(1)
      setCurrentFilters(null)
      return
    }

    setLoading(true)
    setCurrentFilters(filters)
    try {
      const params = buildParams(filters, 1)
      const res = await fetch(`/api/courses/all?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults(Array.isArray(data.courses) ? data.courses : [])
        setTotalCount(typeof data.total === 'number' ? data.total : (data.courses?.length ?? 0))
        setCurrentPage(1)
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

  const loadMore = useCallback(async () => {
    if (!currentFilters || loadingMore) return
    const nextPage = currentPage + 1
    setLoadingMore(true)
    try {
      const params = buildParams(currentFilters, nextPage)
      const res = await fetch(`/api/courses/all?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newCourses: CourseResult[] = Array.isArray(data.courses) ? data.courses : []
        setResults((prev) => [...prev, ...newCourses])
        setCurrentPage(nextPage)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [currentFilters, currentPage, loadingMore])

  const hasMoreResults = results.length < totalCount

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
            {lang === 'en' ? `Found ${totalCount} courses` : `พบ ${totalCount} วิชา`}
          </p>
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="text-gray-500">{lang === 'en' ? 'No courses found' : 'ไม่พบกระบวนวิชา'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {results.map(course => (
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
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-2.5 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === 'en' ? 'Loading...' : 'กำลังโหลด...'}
                    </span>
                  ) : (
                    `${lang === 'en' ? 'Load More' : 'โหลดเพิ่มเติม'} (${totalCount - results.length} ${lang === 'en' ? 'remaining' : 'รายการที่เหลือ'})`
                  )}
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
