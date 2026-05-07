'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Lock } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'STUDENT', label: 'นักศึกษา' },
  { value: 'TEACHER', label: 'อาจารย์' },
  { value: 'ALUMNI', label: 'ศิษย์เก่า' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('กรุณากรอกชื่อที่แสดง')
      return
    }
    if (!status) {
      setError('กรุณาเลือกสถานะ')
      return
    }
    if (status === 'STUDENT' && !yearOfStudy) {
      setError('กรุณาเลือกชั้นปี')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          status,
          yearOfStudy: status === 'STUDENT' ? parseInt(yearOfStudy) : null,
          isProfileComplete: true,
        }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <GraduationCap className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ยินดีต้อนรับ!</h1>
          <p className="text-gray-500 text-sm mt-1">กรุณากรอกข้อมูลเพื่อเริ่มใช้งาน</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                ชื่อที่แสดง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="ชื่อที่จะแสดงในห้องรีวิว"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400">{displayName.length}/50 ตัวอักษร</p>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                สถานะ <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setYearOfStudy('') }}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">-- เลือกสถานะ --</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Year of Study (only for STUDENT) */}
            {status === 'STUDENT' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  ชั้นปี <span className="text-red-500">*</span>
                </label>
                <select
                  value={yearOfStudy}
                  onChange={e => setYearOfStudy(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">-- เลือกชั้นปี --</option>
                  {[1, 2, 3, 4, 5, 6].map(y => (
                    <option key={y} value={String(y)}>ปี {y}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </button>
          </form>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 border-t border-gray-100">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>ข้อมูลของท่านจะเป็นความลับ ไม่มีการเปิดเผยต่อสาธารณะ</span>
          </div>
        </div>
      </div>
    </div>
  )
}
