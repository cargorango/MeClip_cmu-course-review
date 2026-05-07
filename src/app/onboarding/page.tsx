'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Lock, AlertCircle } from 'lucide-react'

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

interface FieldError {
  displayName?: string
  status?: string
  degreeLevel?: string
  yearOfStudy?: string
  faculty?: string
  alumniYear?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState('')
  const [degreeLevel, setDegreeLevel] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [faculty, setFaculty] = useState('')
  const [alumniYear, setAlumniYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setDegreeLevel('')
    setYearOfStudy('')
    setFaculty('')
    setAlumniYear('')
    setFieldErrors(prev => ({ ...prev, status: undefined, degreeLevel: undefined, yearOfStudy: undefined, faculty: undefined, alumniYear: undefined }))
  }

  const validate = (): boolean => {
    const errors: FieldError = {}

    if (!displayName.trim()) {
      errors.displayName = 'กรุณากรอกชื่อที่แสดง'
    } else if (displayName.trim().length > 50) {
      errors.displayName = 'ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร'
    }

    if (!status) {
      errors.status = 'กรุณาเลือกสถานะ'
    } else if (status === 'STUDENT') {
      if (!degreeLevel) errors.degreeLevel = 'กรุณาเลือกระดับปริญญา'
      if (!yearOfStudy) errors.yearOfStudy = 'กรุณาเลือกชั้นปี'
    } else if (status === 'TEACHER') {
      if (!faculty.trim()) errors.faculty = 'กรุณากรอกชื่อคณะ'
      else if (faculty.trim().length > 100) errors.faculty = 'ชื่อคณะต้องมีความยาวไม่เกิน 100 ตัวอักษร'
    } else if (status === 'ALUMNI') {
      if (!alumniYear) {
        errors.alumniYear = 'กรุณากรอกรุ่นที่จบ'
      } else {
        const y = parseInt(alumniYear)
        if (isNaN(y) || y < 1 || y > 99) errors.alumniYear = 'รุ่นที่จบต้องเป็นตัวเลข 1-99'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')

    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          status,
          yearOfStudy: status === 'STUDENT' ? parseInt(yearOfStudy) : null,
          degreeLevel: status === 'STUDENT' ? degreeLevel : null,
          faculty: status === 'TEACHER' ? faculty.trim() : null,
          alumniYear: status === 'ALUMNI' ? parseInt(alumniYear) : null,
          isProfileComplete: true,
        }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setApiError(data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch {
      setApiError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const FieldErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {msg}
      </p>
    ) : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <GraduationCap className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ยินดีต้อนรับ!</h1>
          <p className="text-gray-500 text-sm mt-1">กรุณากรอกข้อมูลให้ครบก่อนเริ่มใช้งาน</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ชื่อที่แสดง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setFieldErrors(p => ({ ...p, displayName: undefined })) }}
                maxLength={50}
                placeholder="ชื่อที่จะแสดงในห้องรีวิว"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.displayName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              <div className="flex justify-between mt-1">
                <FieldErrorMsg msg={fieldErrors.displayName} />
                <span className="text-xs text-gray-400 ml-auto">{displayName.length}/50</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                สถานะ <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${fieldErrors.status ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="" disabled hidden>กรุณาเลือกสถานะ...</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <FieldErrorMsg msg={fieldErrors.status} />
            </div>

            {/* STUDENT: Degree Level */}
            {status === 'STUDENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ระดับปริญญา <span className="text-red-500">*</span>
                </label>
                <select
                  value={degreeLevel}
                  onChange={e => { setDegreeLevel(e.target.value); setFieldErrors(p => ({ ...p, degreeLevel: undefined })) }}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${fieldErrors.degreeLevel ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="" disabled hidden>กรุณาเลือกระดับปริญญา...</option>
                  {DEGREE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <FieldErrorMsg msg={fieldErrors.degreeLevel} />
              </div>
            )}

            {/* STUDENT: Year of Study */}
            {status === 'STUDENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชั้นปี <span className="text-red-500">*</span>
                </label>
                <select
                  value={yearOfStudy}
                  onChange={e => { setYearOfStudy(e.target.value); setFieldErrors(p => ({ ...p, yearOfStudy: undefined })) }}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${fieldErrors.yearOfStudy ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="" disabled hidden>กรุณาเลือกชั้นปี...</option>
                  {[1, 2, 3, 4, 5, 6].map(y => (
                    <option key={y} value={String(y)}>ปี {y}</option>
                  ))}
                </select>
                <FieldErrorMsg msg={fieldErrors.yearOfStudy} />
              </div>
            )}

            {/* TEACHER: Faculty */}
            {status === 'TEACHER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  คณะ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={e => { setFaculty(e.target.value); setFieldErrors(p => ({ ...p, faculty: undefined })) }}
                  maxLength={100}
                  placeholder="เช่น คณะเศรษฐศาสตร์"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.faculty ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldErrorMsg msg={fieldErrors.faculty} />
              </div>
            )}

            {/* ALUMNI: Alumni Year */}
            {status === 'ALUMNI' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  รุ่น/ปีที่จบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={alumniYear}
                  onChange={e => { setAlumniYear(e.target.value); setFieldErrors(p => ({ ...p, alumniYear: undefined })) }}
                  min={1}
                  max={99}
                  placeholder="เช่น 65"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.alumniYear ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <FieldErrorMsg msg={fieldErrors.alumniYear} />
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : 'ยืนยันและเริ่มใช้งาน'}
            </button>
          </form>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>ข้อมูลของท่านจะเป็นความลับ ไม่มีการเปิดเผยต่อสาธารณะ</span>
          </div>
        </div>
      </div>
    </div>
  )
}
