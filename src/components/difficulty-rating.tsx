'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DifficultyRatingProps {
  courseId: string
  isLoggedIn: boolean
  currentRating?: number | null
  averageRating: number | null
  totalRatings: number
  ratingDistribution: { one: number; two: number; three: number }
}

const RATING_LABELS: Record<number, string> = {
  1: '😊 ง่าย',
  2: '😐 กลาง',
  3: '😰 ยาก',
}

export default function DifficultyRating({
  courseId,
  isLoggedIn,
  currentRating,
  averageRating,
  totalRatings,
  ratingDistribution,
}: DifficultyRatingProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(currentRating ?? null)
  const [loading, setLoading] = useState(false)
  const [localAvg, setLocalAvg] = useState(averageRating)
  const [localTotal, setLocalTotal] = useState(totalRatings)
  const [localDist, setLocalDist] = useState(ratingDistribution)
  const [error, setError] = useState('')

  const handleRate = async (rating: number) => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/course/${courseId}`)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/courses/${courseId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelected(rating)
        setLocalAvg(data.averageRating)
        setLocalTotal(data.totalRatings)
        setLocalDist(data.ratingDistribution)
      } else {
        const data = await res.json()
        setError(data.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const maxCount = Math.max(localDist.one, localDist.two, localDist.three, 1)

  return (
    <div className="space-y-4">
      {/* Average display */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">
            {localAvg !== null ? localAvg.toFixed(1) : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">คะแนนเฉลี่ย</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[
            { label: '😰 ยาก', count: localDist.three, value: 3 },
            { label: '😐 กลาง', count: localDist.two, value: 2 },
            { label: '😊 ง่าย', count: localDist.one, value: 1 },
          ].map(({ label, count, value }) => (
            <div key={value} className="flex items-center gap-2 text-xs">
              <span className="w-14 text-gray-600 shrink-0">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">{localTotal} คนให้คะแนน</p>

      {/* Rating buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 text-center">
          {isLoggedIn ? 'ให้คะแนนความยากของวิชานี้' : 'เข้าสู่ระบบเพื่อให้คะแนน'}
        </p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map(rating => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              disabled={loading}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                selected === rating
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
              } disabled:opacity-50`}
            >
              {RATING_LABELS[rating]}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        {!isLoggedIn && (
          <p className="text-xs text-gray-400 text-center">
            <a href={`/login?callbackUrl=/course/${courseId}`} className="text-blue-600 hover:underline">
              เข้าสู่ระบบ
            </a>{' '}
            เพื่อให้คะแนนความยาก
          </p>
        )}
      </div>
    </div>
  )
}
