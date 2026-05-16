'use client'

import { useState, useCallback } from 'react'
import { Loader2, BookOpen } from 'lucide-react'
import { type Lang } from '@/lib/i18n'
import SearchFilters, { type SearchFilterState } from '@/components/search-filters'
import CourseCard from '@/components/course-card'

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

interface Props {
  lang: Lang
  faculties: { id: string; name: string; nameTh: string }[]
  topFreeElectives: CourseResult[]
}

const PAGE_SIZE = 10

export default function FreeElectiveSearchV2({ lang, faculties, topFreeElectives }: Props) {
  const [results, setResults] = useState<CourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasActiveFilter, setHasActiveFilter] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [visibleTop, setVisibleTop] = useState(PAGE_SIZE)

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
      const params = new URLSearchParams({ isFreeElective: 'true' })
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
    <div className="space-y-6">
      {/* Search filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <SearchFilters
          lang={lang}
          faculties={faculties}
          onFilterChange={fetchCourses}
          placeholder={lang === 'en' ? 'Search free elective courses...' : 'ค้นหาวิชาเลือกเสรี (รหัสวิชา หรือ ชื่อวิชา)'}
          focusColor="purple"
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
                    showFreeElectiveTag
                    showReviewCount
                  />
                ))}
              </div>
              {hasMoreResults && (
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="w-full py-2.5 text-sm text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  {lang === 'en' ? 'Load More' : 'โหลดเพิ่มเติม'} ({results.length - visibleCount} {lang === 'en' ? 'remaining' : 'รายการที่เหลือ'})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Discovery — top free electives when no filter active */}
      {!hasActiveFilter && !loading && (
        <div className="space-y-3">
          {topFreeElectives.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{lang === 'en' ? 'No free elective courses yet' : 'ยังไม่มีวิชาเลือกเสรี'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {topFreeElectives.slice(0, visibleTop).map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    lang={lang}
                    showFreeElectiveTag
                    showReviewCount
                  />
                ))}
              </div>
              {topFreeElectives.length > visibleTop && (
                <button
                  onClick={() => setVisibleTop(c => c + PAGE_SIZE)}
                  className="w-full py-2.5 text-sm text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  {lang === 'en' ? 'Load More' : 'โหลดเพิ่มเติม'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
