'use client'

import { GRADE_VALUES } from '@/lib/grade-stats'

interface GradeSelectorProps {
  value: string | null
  onChange: (grade: string | null) => void
  label?: string
}

export default function GradeSelector({ value, onChange, label }: GradeSelectorProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-medium text-gray-600">{label}</p>
      )}
      <div className="flex flex-wrap gap-1">
        {GRADE_VALUES.map((grade) => {
          const isSelected = value === grade
          return (
            <button
              key={grade}
              type="button"
              aria-pressed={isSelected}
              aria-label={`เกรด ${grade}`}
              onClick={() => onChange(isSelected ? null : grade)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {grade}
            </button>
          )
        })}
      </div>
    </div>
  )
}
