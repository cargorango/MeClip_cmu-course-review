'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Loader2, BookOpen } from 'lucide-react'
import { type Lang } from '@/lib/i18n'

interface CourseResult {
  id: string
  code: string
  name: string
  nameTh: string
  codeEn: string
  credits: string
  department: string
  updatedDate: string
  averageRating: number | null
  totalRatings: number
}

interface Props {
  lang: Lang
  initialQ: string
  initialDept: string
}

export default function AllCoursesSearch({ lang, initialQ, initialDept }: Props) {
  const [q, setQ] = useState(initialQ)
  const [dept, setDept] = useState(initialDept)
  const [results, setResults] = useState<CourseResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fetchCourses = useCallback(async (query: string, department: string, p: number) => {
    if (!query && !department) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (query) params.set('q', query)
      if (department) params.set('dept', department)
      const res = await fetch(`/api/courses/all?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.courses ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 0)
        setPage(p)
        setSearched(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourses(q, dept, 1)
  }

  return (
    <div className="space-y-4">
      {/* Search form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={lang === 'en' ? 'Search by code, name...' : 'ค้นหารหัสวิชา, ชื่อวิชา...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            value={dept}
            onChange={e => setDept(e.target.value)}
            placeholder={lang === 'en' ? 'Filter by faculty...' : 'กรองตามคณะ...'}
            className="w-40 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={loading || (!q && !dept)} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {lang === 'en' ? 'Search' : 'ค้นหา'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          {lang === 'en' ? 'Enter a search term to display courses' : 'กรอกคำค้นหาเพื่อแสดงรายการวิชา'}
        </p>
      </div>

      {/* Empty state */}
      {!searched && !loading && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{lang === 'en' ? 'Search to find courses' : 'ค้นหาเพื่อแสดงรายการวิชา'}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          {lang === 'en' ? 'Searching...' : 'กำลังค้นหา...'}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          <p className="text-sm text-gray-500">
            {lang === 'en' ? `Found ${total} courses` : `พบ ${total} วิชา`}
          </p>
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="text-gray-500">{lang === 'en' ? 'No courses found' : 'ไม่พบกระบวนวิชา'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(course => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}?lang=${lang}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-blue-600">{course.code}</p>
                        {course.codeEn && course.codeEn !== '-' && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{course.codeEn}</span>
                        )}
                        {course.credits && course.credits !== '-' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{course.credits} หน่วยกิต</span>
                        )}
                        {course.department && course.department !== '-' && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{course.department}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{course.nameTh}</p>
                      <p className="text-xs text-gray-500">{course.name}</p>
                      {course.updatedDate && course.updatedDate !== '-' && (
                        <p className="text-xs text-gray-400 mt-1">อัปเดตล่าสุด: {course.updatedDate}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {course.averageRating !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="text-sm font-semibold text-gray-700">{course.averageRating}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{lang === 'en' ? 'No rating' : 'ยังไม่มีคะแนน'}</span>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{course.totalRatings} {lang === 'en' ? 'reviews' : 'รีวิว'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => fetchCourses(q, dept, page - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">
                {lang === 'en' ? 'Previous' : 'ก่อนหน้า'}
              </button>
              <span className="text-sm text-gray-600">หน้า {page} / {totalPages}</span>
              <button onClick={() => fetchCourses(q, dept, page + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">
                {lang === 'en' ? 'Next' : 'ถัดไป'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
