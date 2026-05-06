'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { type Lang } from '@/lib/i18n'

interface FreeElectiveSearchProps {
  initialQuery?: string
  lang?: Lang
}

export default function FreeElectiveSearch({ initialQuery = '', lang = 'th' }: FreeElectiveSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) {
        params.set('q', val)
      } else {
        params.delete('q')
      }
      router.replace(`/free-electives?${params.toString()}`, { scroll: false })
    }, 300)
  }

  const clear = () => {
    setQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.replace(`/free-electives?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={lang === 'en' ? 'Search free elective courses...' : 'ค้นหาวิชาเลือกเสรี (รหัสวิชา หรือ ชื่อวิชา)'}
        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-shadow"
      />
      {query && (
        <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
