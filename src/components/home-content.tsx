'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Search } from 'lucide-react'
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
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set('lang', lang)
    if (q.trim()) params.set('q', q.trim())
    router.push(`/courses?${params.toString()}`)
  }

  return (
    <>
      {/* Simple search bar — text input only, redirects to /courses */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={lang === 'en' ? 'Search courses (code or name)' : 'ค้นหากระบวนวิชา (รหัสวิชา หรือ ชื่อวิชา)'}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            aria-label="ค้นหา"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discovery section */}
      <>
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
      </>
    </>
  )
}
