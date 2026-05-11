import { GradeDistribution, GRADE_VALUES } from '@/lib/grade-stats'
import type { Lang } from '@/lib/i18n'

interface GradeStatsProps {
  stats: GradeDistribution | null
  lang?: Lang
}

export default function GradeStats({ stats, lang = 'th' }: GradeStatsProps) {
  if (!stats) return null

  const title = lang === 'en' ? 'Grade Statistics' : 'สถิติเกรด'

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="space-y-1.5">
        {GRADE_VALUES.map((grade) => {
          const entry = stats.grades.find((g) => g.grade === grade)
          const count = entry?.count ?? 0
          const percentage = entry?.percentage ?? 0
          const isMostCommon = stats.mostCommon === grade && count > 0

          return (
            <div
              key={grade}
              className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                isMostCommon ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              {/* Grade label */}
              <span
                className={`w-8 text-xs font-bold shrink-0 ${
                  isMostCommon ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                {grade}
              </span>

              {/* Bar */}
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isMostCommon ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count + percentage */}
              <div className="flex items-center gap-1.5 shrink-0 w-24 justify-end">
                <span className="text-xs text-gray-500">{count}</span>
                <span
                  className={`text-xs font-medium w-12 text-right ${
                    isMostCommon ? 'text-blue-700' : 'text-gray-500'
                  }`}
                >
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400">
        {lang === 'en' ? `Total: ${stats.total} responses` : `ทั้งหมด: ${stats.total} คน`}
      </p>
    </div>
  )
}
