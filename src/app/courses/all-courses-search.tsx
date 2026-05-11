'use client'

import { useState, useCallback } from 'react'
import { Loader2, BookOpen, TrendingUp, MessageSquare } from 'lucide-react'
import { type Lang } from '@/lib/i18n'
import SearchFilters, { type SearchFilterState } from '@/components/search-filters'
import CourseCard from '@/components/course-card'

interface CourseResult {
  id: string
  code: string
  name: string
  nameTh: string
  credits: string
  faculty: { nameTh: string } | null
  reviewCount: number
  averageRating: number | null
  isFreeElective: boolean
}

interface Props {
  lang: Lang
  initialQ: string
  initialDept: string
  faculties: { id: string; nameTh: string }[]
  mostSearchedCourses: CourseResult[]
  coursesWithReviews: CourseResult[]
}

const PAGE_SIZE = 10

export default function AllCoursesSearch({
  lang,
  initialQ,
  faculties,
  mostSearchedCourses,
  coursesWithReviews,
}: Props) {
  const [results, setResults] = useState<CourseResult[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFilters, setCurrentFilters] = useState<SearchFilterState | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasActiveFilter, setHasActiveFilter] = useState(false)

  // Discovery section load-more state
  const [visibleMostSearched, setVisibleMostSearched] = useState(PAGE_SIZE)
  const [visibleWithReviews, setVisibleWithReviews] = useState(PAGE_SIZE)

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
    <div className="space-y-6">
      {/* Search filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <SearchFilters
          lang={lang}
          faculties={faculties}
          onFilterChange={fetchCourses}
          initialState={{ q: initialQ }}
          focusColor="blue"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          {lang === 'en' ? 'Searching...' : 'กำลังค้นหา...'}
        </div>
      )}

      {/* Filter results */}
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

      {/* Discovery sections — shown when no filter active */}
      {!hasActiveFilter && !loading && (
        <div className="space-y-8">
          {/* Most Searched */}
          {mostSearchedCourses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  {lang === 'en' ? 'Most Searched Courses' : 'วิชาที่ค้นหามากสุด'}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {mostSearchedCourses.slice(0, visibleMostSearched).map(course => (
                  <CourseCard key={course.id} course={course} lang={lang} showReviewCount />
                ))}
              </div>
              {mostSearchedCourses.length > visibleMostSearched && (
                <button
                  onClick={() => setVisibleMostSearched(c => c + PAGE_SIZE)}
                  className="w-full py-2.5 text-sm text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  {lang === 'en' ? 'Load More' : 'โหลดเพิ่มเติม'}
                </button>
              )}
            </section>
          )}

          {/* Courses With Reviews */}
          {coursesWithReviews.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  {lang === 'en' ? 'Courses with Reviews' : 'วิชาที่มีรีวิว'}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {coursesWithReviews.slice(0, visibleWithReviews).map(course => (
                  <CourseCard key={course.id} course={course} lang={lang} showReviewCount />
                ))}
              </div>
              {coursesWithReviews.length > visibleWithReviews && (
                <button
                  onClick={() => setVisibleWithReviews(c => c + PAGE_SIZE)}
                  className="w-full py-2.5 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  {lang === 'en' ? 'Load More' : 'โหลดเพิ่มเติม'}
                </button>
              )}
            </section>
          )}

          {/* Empty discovery state */}
          {mostSearchedCourses.length === 0 && coursesWithReviews.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{lang === 'en' ? 'Search to find courses' : 'ค้นหาเพื่อแสดงรายการวิชา'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
