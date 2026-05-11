'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Search, Loader2, Star } from 'lucide-react'
import { type Lang, translations } from '@/lib/i18n'
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
  averageRating: number | null
  reviewCount: number
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
  topCourses,
  freeElectiveCount,
  initialQuery,
}: HomeContentProps) {
  const tr = translations[lang]
  const [q, setQ] = useState(initialQuery)
  const [results, setResults] = useState<CourseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchResults = async (query: string) => {
    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query.trim(), page: '1' })
      const res = await fetch(`/api/courses/all?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults((data.courses ?? []).slice(0, 8))
        setShowResults(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQ(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length >= 2) {
      setLoading(true)
      debounceRef.current = setTimeout(() => fetchResults(val), 350)
    } else {
      setLoading(false)
      setResults([])
      setShowResults(false)
    }
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <>
      {/* Inline search bar with dropdown results */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="relative" ref={wrapperRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={q}
                onChange={handleChange}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder={lang === 'en' ? 'Search courses (code or name)' : 'ค้นหากระบวนวิชา (รหัสวิชา หรือ ชื่อวิชา)'}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow"
                autoComplete="off"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
              )}
            </div>
          </div>

          {/* Inline results dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {results.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}?lang=${lang}`}
                  onClick={() => setShowResults(false)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 shrink-0">{course.code}</span>
                      {course.credits && (
                        <span className="text-xs text-gray-400 shrink-0">{course.credits} หน่วยกิต</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{course.nameTh}</p>
                    <p className="text-xs text-gray-400 truncate">{course.name}</p>
                  </div>
                  {course.averageRating !== null && (
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-gray-600">{course.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
              {/* See all results link */}
              <Link
                href={`/courses?q=${encodeURIComponent(q)}&lang=${lang}`}
                onClick={() => setShowResults(false)}
                className="flex items-center justify-center px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                {lang === 'en' ? 'See all results →' : 'ดูผลลัพธ์ทั้งหมด →'}
              </Link>
            </div>
          )}

          {/* No results */}
          {showResults && !loading && results.length === 0 && q.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-gray-500">
              {lang === 'en' ? 'No courses found' : 'ไม่พบกระบวนวิชา'}
            </div>
          )}
        </div>
      </div>

      {/* Discovery section */}
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

      {topCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <TopCourses
            courses={topCourses}
            lang={lang}
            labels={{ topCourses: tr.topCourses, reviews: tr.reviews }}
          />
        </div>
      )}

      {/* Social support section */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-center space-y-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-800">🤍 สนับสนุนเราได้ที่นี่</p>
          <p className="text-sm text-gray-500">
            ถ้าเครื่องมือนี้มีประโยชน์ ติดตามและสนับสนุน MeClip ได้ที่ช่องทางด้านล่างนี้เลย
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <a href="https://www.instagram.com/meclips_official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="w-14 h-14 rounded-2xl overflow-hidden shadow-md hover:scale-110 transition-transform">
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </a>

          <a href="https://x.com/Meclipthailand" target="_blank" rel="noopener noreferrer" aria-label="X"
            className="w-14 h-14 rounded-2xl overflow-hidden shadow-md hover:scale-110 transition-transform bg-black flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>

          <a href="https://www.facebook.com/profile.php?id=61574323546875" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
            className="w-14 h-14 rounded-2xl overflow-hidden shadow-md hover:scale-110 transition-transform bg-[#1877F2] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>
      </div>
    </>
  )
}
