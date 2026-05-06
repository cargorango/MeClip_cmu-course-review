'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { type Lang, t } from '@/lib/i18n'

interface CourseResult {
  id: string
  code: string
  name: string
  nameTh: string
  averageRating: number | null
  totalRatings: number
}

interface CourseSearchProps {
  initialQuery?: string
  lang?: Lang
}

export default function CourseSearch({ initialQuery = '', lang = 'th' }: CourseSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<CourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCourses = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      const res = await fetch(`/api/courses?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.courses ?? [])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      fetchCourses(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchCourses])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set('q', val)
    } else {
      params.delete('q')
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  const placeholder = lang === 'en'
    ? 'Search courses (code or name)'
    : 'ค้นหากระบวนวิชา (รหัสวิชา หรือ ชื่อวิชา)'

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-500 text-sm">{t(lang, 'searching')}</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-base font-medium text-gray-700">{t(lang, 'notFound')}</p>
          <p className="text-sm mt-1 text-gray-400">{t(lang, 'notFoundSub')}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map(course => (
            <Link
              key={course.id}
              href={`/course/${course.id}?lang=${lang}`}
              prefetch={true}
              className="block p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-600">{course.code}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{course.nameTh}</p>
                  <p className="text-xs text-gray-500 truncate">{course.name}</p>
                </div>
                <div className="text-right shrink-0">
                  {course.averageRating !== null ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-sm font-semibold text-gray-700">{course.averageRating}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">{t(lang, 'noRating')}</span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{course.totalRatings} {t(lang, 'reviews')}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
