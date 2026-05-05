'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export interface CurriculumOption {
  id: string
  label: string
  programType: 'REGULAR' | 'INTERNATIONAL'
  curriculumYear: number
}

interface CurriculumFilterProps {
  options: CurriculumOption[]
  selectedId: string
}

export default function CurriculumFilter({ options, selectedId }: CurriculumFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id) {
        params.set('curriculum', id)
      } else {
        params.delete('curriculum')
      }
      params.delete('q') // reset search when changing curriculum
      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  const regularOptions = options.filter(o => o.programType === 'REGULAR')
  const internationalOptions = options.filter(o => o.programType === 'INTERNATIONAL')

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">เลือกหลักสูตร</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ภาคปกติ */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">ภาคปกติ</p>
          <div className="flex flex-col gap-2">
            {regularOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                  selectedId === opt.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {opt.curriculumYear === 2025 ? 'หลักสูตรใหม่ (ปี 1-2)' : 'หลักสูตรเก่า (ปี 3-4)'}
              </button>
            ))}
          </div>
        </div>

        {/* นานาชาติ */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">นานาชาติ</p>
          <div className="flex flex-col gap-2">
            {internationalOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                  selectedId === opt.id
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                {opt.curriculumYear === 2025 ? 'หลักสูตรใหม่ (ปี 1-2)' : 'หลักสูตรเก่า (ปี 3-4)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedId && (
        <button
          onClick={() => handleSelect('')}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ล้างตัวกรอง
        </button>
      )}
    </div>
  )
}
