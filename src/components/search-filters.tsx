'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { GRADE_VALUES } from '@/lib/grade-stats'
import { toThaiName } from '@/lib/faculty-translation'
import type { Lang } from '@/lib/i18n'

export interface SearchFilterState {
  q: string
  dept: string
  facultyId: string   // kept for backward compat
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

interface DeptOption {
  value: string
  label: string
}

export default function SearchFilters({
  lang,
  onFilterChange,
  initialState,
  placeholder,
  focusColor = 'blue',
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilterState>({
    ...DEFAULT_STATE,
    ...initialState,
  })
  const [deptOptions, setDeptOptions] = useState<DeptOption[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Always keep a ref to the latest filters — prevents stale closure in callbacks
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  // Stable callback ref — onFilterChange may change between renders
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
    filters.dept !== '' ||
    filters.credits !== '' ||
    filters.sort !== '' ||
    filters.grade !== ''

  // Fetch departments from API
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => {
        const opts: DeptOption[] = []
        if (data.hasFreeElective) {
          opts.push({
            value: 'FREE_ELECTIVE',
            label: lang === 'en' ? 'Free Electives' : 'วิชาเลือกเสรี',
          })
        }
        if (Array.isArray(data.departments)) {
          for (const d of data.departments) {
            opts.push({ value: d, label: lang === 'th' ? toThaiName(d) : d })
          }
        }
        setDeptOptions(opts)
      })
      .catch(() => {})
  }, [lang])

  // Trigger search immediately when dropdown values change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Use filtersRef.current to always get the latest state
    onFilterChangeRef.current(filtersRef.current)
  }, [filters.dept, filters.sort, filters.grade])

  // Submit search with latest filters (no stale closure)
  const submitSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onFilterChangeRef.current(filtersRef.current)
  }, [])

  const handleQChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilters((prev) => ({ ...prev, q: val }))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Use functional update pattern to get latest state
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
    (field: keyof Omit<SearchFilterState, 'q' | 'credits'>) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      setFilters((prev) => ({ ...prev, [field]: val }))
      // Note: the useEffect above will fire after state update and call onFilterChange
    }

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setFilters(DEFAULT_STATE)
    onFilterChangeRef.current(DEFAULT_STATE)
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
        {/* Faculty/Department select */}
        <select
          value={filters.dept}
          onChange={handleSelectChange('dept')}
          className={`flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${focusRing}`}
        >
          <option value="">{lang === 'en' ? 'All Faculties' : 'ทุกคณะ'}</option>
          {deptOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

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
