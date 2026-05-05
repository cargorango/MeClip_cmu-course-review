'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  displayName: string
  isAnonymous: boolean
}

export default function ProfileForm({ displayName, isAnonymous }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [anonymous, setAnonymous] = useState(isAnonymous)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, isAnonymous: anonymous }),
      })
      if (res.ok) {
        setSuccess(true)
        router.refresh()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">ชื่อที่แสดง</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ชื่อที่แสดงในห้องรีวิว"
        />
        <p className="text-xs text-gray-400">{name.length}/50 ตัวอักษร</p>
      </div>

      {/* Anonymous mode */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700">โหมดไม่ระบุตัวตน</p>
          <p className="text-xs text-gray-500 mt-0.5">
            ข้อความจะแสดงเป็น &quot;ไม่ระบุตัวตน&quot; โดยไม่มีระดับนักรีวิว
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAnonymous(!anonymous)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            anonymous ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              anonymous ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">บันทึกการเปลี่ยนแปลงเรียบร้อย</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
      </button>
    </form>
  )
}
