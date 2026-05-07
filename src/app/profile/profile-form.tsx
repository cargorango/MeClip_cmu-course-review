'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  displayName: string
  isAnonymous: boolean
  status: string | null
  yearOfStudy: number | null
  degreeLevel: string | null
  faculty: string | null
  alumniYear: number | null
}

const STATUS_OPTIONS = [
  { value: 'STUDENT', label: 'นักศึกษา' },
  { value: 'TEACHER', label: 'อาจารย์' },
  { value: 'ALUMNI', label: 'ศิษย์เก่า' },
]

const DEGREE_OPTIONS = [
  { value: 'BACHELOR', label: 'ป.ตรี' },
  { value: 'MASTER', label: 'ป.โท' },
  { value: 'DOCTORAL', label: 'ป.เอก' },
]

export default function ProfileForm({
  displayName,
  isAnonymous,
  status,
  yearOfStudy,
  degreeLevel,
  faculty,
  alumniYear,
}: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [anonymous, setAnonymous] = useState(isAnonymous)
  const [selectedStatus, setSelectedStatus] = useState(status ?? '')
  const [selectedYear, setSelectedYear] = useState(yearOfStudy ? String(yearOfStudy) : '')
  const [selectedDegreeLevel, setSelectedDegreeLevel] = useState(degreeLevel ?? '')
  const [selectedFaculty, setSelectedFaculty] = useState(faculty ?? '')
  const [selectedAlumniYear, setSelectedAlumniYear] = useState(alumniYear ? String(alumniYear) : '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus)
    // Clear all status-specific fields when status changes
    setSelectedYear('')
    setSelectedDegreeLevel('')
    setSelectedFaculty('')
    setSelectedAlumniYear('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name,
          isAnonymous: anonymous,
          status: selectedStatus || null,
          yearOfStudy: selectedStatus === 'STUDENT' && selectedYear ? parseInt(selectedYear) : null,
          degreeLevel: selectedStatus === 'STUDENT' && selectedDegreeLevel ? selectedDegreeLevel : null,
          faculty: selectedStatus === 'TEACHER' && selectedFaculty ? selectedFaculty.trim() : null,
          alumniYear: selectedStatus === 'ALUMNI' && selectedAlumniYear ? parseInt(selectedAlumniYear) : null,
        }),
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

      {/* Status */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">สถานะ</label>
        <select
          value={selectedStatus}
          onChange={e => handleStatusChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">-- ไม่ระบุ --</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* STUDENT: Degree Level */}
      {selectedStatus === 'STUDENT' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">ระดับปริญญา</label>
          <select
            value={selectedDegreeLevel}
            onChange={e => setSelectedDegreeLevel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- ไม่ระบุ --</option>
            {DEGREE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* STUDENT: Year of Study */}
      {selectedStatus === 'STUDENT' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">ชั้นปี</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- ไม่ระบุ --</option>
            {[1, 2, 3, 4, 5, 6].map(y => (
              <option key={y} value={String(y)}>ปี {y}</option>
            ))}
          </select>
        </div>
      )}

      {/* TEACHER: Faculty */}
      {selectedStatus === 'TEACHER' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">คณะ</label>
          <input
            type="text"
            value={selectedFaculty}
            onChange={e => setSelectedFaculty(e.target.value)}
            maxLength={100}
            placeholder="เช่น คณะเศรษฐศาสตร์"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* ALUMNI: Alumni Year */}
      {selectedStatus === 'ALUMNI' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">รุ่น/ปีที่จบ</label>
          <input
            type="number"
            value={selectedAlumniYear}
            onChange={e => setSelectedAlumniYear(e.target.value)}
            min={1}
            max={99}
            placeholder="เช่น 65"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Anonymous mode */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700">โหมดไม่ระบุตัวตน</p>
          <p className="text-xs text-gray-500 mt-0.5">
            ข้อความจะแสดงสถานะแทนชื่อ (เช่น &quot;นักศึกษา ป.ตรี ปี3&quot;)
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
