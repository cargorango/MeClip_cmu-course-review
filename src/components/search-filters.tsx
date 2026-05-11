'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { GRADE_VALUES } from '@/lib/grade-stats'
import type { Lang } from '@/lib/i18n'

export interface SearchFilterState {
  q: string
  facultyId: string
  credits: string
  sort: string
}

interface SearchFiltersProps {
  lang: Lang
  faculties: { id: string; nameTh: string }[]
  onFilterChange: (filters: SearchFilterState) => void
  initialState?: Partial<SearchFilterState>
  placeholder?: string
  focusColor?: 'blue' | 'purple'
}

const DEFAULT_STATE: SearchFilterState = {
  q: '',
  facultyId: '',
  credits: '',
  sort: '',
}

export default function SearchFilters({
  lang,
  faculties,
  onFilterChange,
  initialState,
  placeholder,
  focusColor = 'blue',
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilterState>({
    ...DEFAULT_STATE,
    ...initialState,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const focusRing =
    focusColor === 'purple'
      ? 'focus:ring-purple-500 focus:border-transparent'
      : 'focus:ring-blue-500 focus:border-transparent'

  const searchPlaceholder =
    placeholder ??
    (lang === 'en' ? 'Search courses (code or name)' : 'ค้นหากระบวนวิชา (รหัสวิชา หรือ ชื่อวิชา)')

  const hasActiveFilter =
    filters.q !== '' ||
    filters.facultyId !== '' ||
    filters.credits !== '' ||
    filters.sort !== ''

  // Notify parent on filter change (debounce text input)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onFilterChange(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.facultyId, filters.credits, filters.sort])

  const handleQChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilters((prev) => ({ ...prev, q: val }))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({ ...filters, q: val })
    }, 300)
  }

  const handleSelectChange =
    (field: keyof Omit<SearchFilterState, 'q'>) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const val = e.target.value
      setFilters((prev) => {
        const next = { ...prev, [field]: val }
        return next
      })
    }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setFilters(DEFAULT_STATE)
    onFilterChange(DEFAULT_STATE)
  }

  return (
    <div className="space-y-3">
      {/* Text search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={filters.q}
          onChange={handleQChange}
          placeholder={searchPlaceholder}
          className={`w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${focusRing} bg-white transition-shadow`}
        />
        {filters.q && (
          <button
            type="button"
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              setFilters((prev) => ({ ...prev, q: '' }))
              onFilterChange({ ...filters, q: '' })
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="ล้างคำค้นหา"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Secondary filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Faculty select */}
        <select
          value={filters.facultyId}
          onChange={handleSelectChange('facultyId')}
          className={`flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${focusRing}`}
        >
          <option value="">{lang === 'en' ? 'All Faculties' : 'ทุกคณะ'}</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nameTh}
            </option>
          ))}
        </select>

        {/* Credits input */}
        <input
          type="number"
          min="1"
          value={filters.credits}
          onChange={handleSelectChange('credits')}
          placeholder={lang === 'en' ? 'Credits' : 'หน่วยกิต'}
          className={`w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${focusRing}`}
        />

        {/* Sort select */}
        <select
          value={filters.sort}
          onChange={handleSelectChange('sort')}
          className={`flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${focusRing}`}
        >
          <option value="">{lang === 'en' ? 'Sort by code' : 'เรียงตามรหัส'}</option>
          <option value="reviews">{lang === 'en' ? 'Most reviewed' : 'มีรีวิวมากสุด'}</option>
          {GRADE_VALUES.map((g) => (
            <option key={g} value={g}>
              {lang === 'en' ? `Grade ${g}` : `เกรด ${g}`}
            </option>
          ))}
        </select>

        {/* Reset button */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </div>
  )
}
