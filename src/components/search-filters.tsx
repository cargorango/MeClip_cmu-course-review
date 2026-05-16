'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { GRADE_VALUES } from '@/lib/grade-stats'
import { toThaiName } from '@/lib/faculty-translation'
import type { Lang } from '@/lib/i18n'

export interface SearchFilterState {
  q: string
  dept: string
  facultyId: string
  credits: string
  sort: string
  grade: string
}

interface SearchFiltersProps {
  lang: Lang
  faculties?: { id: string; nameTh: string }[]
  onFilterChange: (filters: SearchFilterState) => void
  initialState?: Partial<SearchFilterState>
  placeholder?: string
  focusColor?: 'blue' | 'purple'
}

const DEFAULT_STATE: SearchFilterState = {
  q: '',
  dept: '',
  facultyId: '',
  credits: '',
  sort: '',
  grade: '',
}

export default function SearchFilters({
  lang,
  faculties = [],
  onFilterChange,
  initialState,
  placeholder,
  focusColor = 'blue',
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilterState>({
    ...DEFAULT_STATE,
    ...initialState,
  })
  const [facultyOpen, setFacultyOpen] = useState(false)
  const facultyRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const onFilterChangeRef = useRef(onFilterChange)
  onFilterChangeRef.current = onFilterChange

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
    filters.sort !== '' ||
    filters.grade !== ''

  // Close faculty dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (facultyRef.current && !facultyRef.current.contains(e.target as Node)) {
        setFacultyOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Trigger search when dropdown values change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onFilterChangeRef.current(filtersRef.current)
  }, [filters.facultyId, filters.sort, filters.grade])

  const submitSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onFilterChangeRef.current(filtersRef.current)
  }, [])

  const handleQChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilters((prev) => ({ ...prev, q: val }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChangeRef.current({ ...filtersRef.current, q: val })
    }, 300)
  }

  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilters((prev) => ({ ...prev, credits: val }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChangeRef.current({ ...filtersRef.current, credits: val })
    }, 300)
  }

  const handleSelectChange =
    (field: keyof Omit<SearchFilterState, 'q' | 'credits' | 'facultyId'>) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      setFilters((prev) => ({ ...prev, [field]: val }))
    }

  const handleFacultySelect = (value: string) => {
    setFilters((prev) => ({ ...prev, facultyId: value }))
    setFacultyOpen(false)
  }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setFilters(DEFAULT_STATE)
    onFilterChangeRef.current(DEFAULT_STATE)
  }

  // Build faculty label for selected value
  const getFacultyLabel = (id: string) => {
    if (!id) return lang === 'en' ? 'All Faculties' : 'ทุกคณะ'
    if (id === 'FREE_ELECTIVE') return lang === 'en' ? 'Free Electives' : 'วิชาเลือกเสรี'
    const f = faculties.find((x) => x.id === id)
    if (!f) return lang === 'en' ? 'All Faculties' : 'ทุกคณะ'
    return lang === 'th' ? toThaiName(f.nameTh) : f.nameTh
  }

  return (
    <div className="space-y-3">
      {/* Text search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={filters.q}
            onChange={handleQChange}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder={searchPlaceholder}
            className={`w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${focusRing} bg-white transition-shadow`}
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                setFilters((prev) => ({ ...prev, q: '' }))
                onFilterChangeRef.current({ ...filtersRef.current, q: '' })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="ล้างคำค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={submitSearch}
          className={`px-4 py-3 rounded-xl text-sm font-medium text-white transition-colors ${
            focusColor === 'purple'
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-label="ค้นหา"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Secondary filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Faculty custom dropdown — always opens downward */}
        <div ref={facultyRef} className="relative flex-1 min-w-[140px]">
          <button
            type="button"
            onClick={() => setFacultyOpen((o) => !o)}
            className={`w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${focusRing} ${
              filters.facultyId ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            <span className="truncate">{getFacultyLabel(filters.facultyId)}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-1 transition-transform ${facultyOpen ? 'rotate-180' : ''}`} />
          </button>

          {facultyOpen && (
            <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
              {/* All faculties option */}
              <button
                type="button"
                onClick={() => handleFacultySelect('')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!filters.facultyId ? 'font-medium text-blue-600 bg-blue-50' : 'text-gray-700'}`}
              >
                {lang === 'en' ? 'All Faculties' : 'ทุกคณะ'}
              </button>
              {/* Free elective option */}
              <button
                type="button"
                onClick={() => handleFacultySelect('FREE_ELECTIVE')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${filters.facultyId === 'FREE_ELECTIVE' ? 'font-medium text-blue-600 bg-blue-50' : 'text-gray-700'}`}
              >
                {lang === 'en' ? 'Free Electives' : 'วิชาเลือกเสรี'}
              </button>
              {/* Faculty options */}
              {faculties.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFacultySelect(f.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${filters.facultyId === f.id ? 'font-medium text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  {lang === 'th' ? toThaiName(f.nameTh) : f.nameTh}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Credits — text input */}
        <input
          type="text"
          inputMode="numeric"
          value={filters.credits}
          onChange={handleCreditsChange}
          onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
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
        </select>

        {/* Grade select */}
        <select
          value={filters.grade}
          onChange={handleSelectChange('grade')}
          className={`flex-1 min-w-[130px] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${focusRing}`}
        >
          <option value="">{lang === 'en' ? 'All Grades' : 'ทุกเกรด'}</option>
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
            {lang === 'en' ? 'Clear' : 'ล้างตัวกรอง'}
          </button>
        )}
      </div>
    </div>
  )
}
