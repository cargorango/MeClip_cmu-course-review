'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, X, ChevronDown, ChevronRight, Building2 } from 'lucide-react'

interface Curriculum {
  id: string
  programType: string
  curriculumYear: number
  _count: { courses: number }
}

interface Faculty {
  id: string
  name: string
  nameTh: string
  _count: { courses: number }
  curricula: Curriculum[]
}

export default function AdminFacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null)

  // Forms
  const [showFacultyForm, setShowFacultyForm] = useState(false)
  const [facultyForm, setFacultyForm] = useState({ name: '', nameTh: '' })

  const [showCurriculumForm, setShowCurriculumForm] = useState<string | null>(null)
  const [curriculumForm, setCurriculumForm] = useState({
    programType: 'REGULAR',
    curriculumYear: '2025',
  })

  const [showCourseForm, setShowCourseForm] = useState<string | null>(null)
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    nameTh: '',
    curriculumId: '',
  })

  const fetchFaculties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/faculties')
      if (res.ok) {
        const data = await res.json()
        setFaculties(data.faculties ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFaculties()
  }, [fetchFaculties])

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/faculties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faculty', ...facultyForm }),
    })
    if (res.ok) {
      setMessage('เพิ่มคณะเรียบร้อย')
      setShowFacultyForm(false)
      setFacultyForm({ name: '', nameTh: '' })
      fetchFaculties()
    } else {
      const d = await res.json()
      setMessage(d.error ?? 'เกิดข้อผิดพลาด')
    }
  }

  const handleCreateCurriculum = async (e: React.FormEvent, facultyId: string) => {
    e.preventDefault()
    const res = await fetch('/api/admin/faculties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'curriculum', facultyId, ...curriculumForm }),
    })
    if (res.ok) {
      setMessage('เพิ่มหลักสูตรเรียบร้อย')
      setShowCurriculumForm(null)
      fetchFaculties()
    } else {
      const d = await res.json()
      setMessage(d.error ?? 'เกิดข้อผิดพลาด')
    }
  }

  const handleCreateCourse = async (e: React.FormEvent, facultyId: string) => {
    e.preventDefault()
    const res = await fetch('/api/admin/faculties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'course', facultyId, ...courseForm }),
    })
    if (res.ok) {
      setMessage('เพิ่มวิชาเรียบร้อย')
      setShowCourseForm(null)
      setCourseForm({ code: '', name: '', nameTh: '', curriculumId: '' })
      fetchFaculties()
    } else {
      const d = await res.json()
      setMessage(d.error ?? 'เกิดข้อผิดพลาด')
    }
  }

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm('ยืนยันการลบคณะนี้? (จะลบวิชาทั้งหมดในคณะด้วย)')) return
    const res = await fetch(`/api/admin/faculties?facultyId=${facultyId}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage('ลบคณะเรียบร้อย')
      fetchFaculties()
    } else {
      const d = await res.json()
      setMessage(d.error ?? 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการคณะและวิชา</h1>
          <p className="text-sm text-gray-500 mt-0.5">{faculties.length} คณะในระบบ</p>
        </div>
        <button
          onClick={() => setShowFacultyForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มคณะ
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add faculty form */}
      {showFacultyForm && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">เพิ่มคณะใหม่</h3>
          <form onSubmit={handleCreateFaculty} className="space-y-3">
            <input
              type="text"
              value={facultyForm.nameTh}
              onChange={e => setFacultyForm(f => ({ ...f, nameTh: e.target.value }))}
              placeholder="ชื่อคณะ (ภาษาไทย)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              value={facultyForm.name}
              onChange={e => setFacultyForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Faculty Name (English)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
                บันทึก
              </button>
              <button type="button" onClick={() => setShowFacultyForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Faculties list */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">กำลังโหลด...</div>
      ) : faculties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">ยังไม่มีคณะในระบบ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faculties.map(faculty => (
            <div key={faculty.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Faculty header */}
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => setExpandedFaculty(expandedFaculty === faculty.id ? null : faculty.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {expandedFaculty === faculty.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{faculty.nameTh}</p>
                    <p className="text-xs text-gray-500">{faculty.name} · {faculty._count.courses} วิชา · {faculty.curricula.length} หลักสูตร</p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowCourseForm(faculty.id); setShowCurriculumForm(null) }}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    + วิชา
                  </button>
                  <button
                    onClick={() => { setShowCurriculumForm(faculty.id); setShowCourseForm(null) }}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    + หลักสูตร
                  </button>
                  <button
                    onClick={() => handleDeleteFaculty(faculty.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Add curriculum form */}
              {showCurriculumForm === faculty.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-blue-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">เพิ่มหลักสูตร</h4>
                  <form onSubmit={e => handleCreateCurriculum(e, faculty.id)} className="flex flex-wrap gap-2">
                    <select
                      value={curriculumForm.programType}
                      onChange={e => setCurriculumForm(f => ({ ...f, programType: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="REGULAR">ภาคปกติ</option>
                      <option value="INTERNATIONAL">นานาชาติ</option>
                    </select>
                    <select
                      value={curriculumForm.curriculumYear}
                      onChange={e => setCurriculumForm(f => ({ ...f, curriculumYear: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="2024">2024 (หลักสูตรเก่า)</option>
                      <option value="2025">2025 (หลักสูตรใหม่)</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">บันทึก</button>
                    <button type="button" onClick={() => setShowCurriculumForm(null)} className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">ยกเลิก</button>
                  </form>
                </div>
              )}

              {/* Add course form */}
              {showCourseForm === faculty.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-green-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">เพิ่มวิชา</h4>
                  <form onSubmit={e => handleCreateCourse(e, faculty.id)} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={courseForm.code}
                        onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))}
                        placeholder="รหัสวิชา (เช่น 201101)"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                        required
                      />
                      <select
                        value={courseForm.curriculumId}
                        onChange={e => setCourseForm(f => ({ ...f, curriculumId: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                        required
                      >
                        <option value="">เลือกหลักสูตร</option>
                        {faculty.curricula.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.programType === 'REGULAR' ? 'ภาคปกติ' : 'นานาชาติ'} {c.curriculumYear}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={courseForm.nameTh}
                      onChange={e => setCourseForm(f => ({ ...f, nameTh: e.target.value }))}
                      placeholder="ชื่อวิชา (ภาษาไทย)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                      required
                    />
                    <input
                      type="text"
                      value={courseForm.name}
                      onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Course Name (English)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                      required
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">บันทึก</button>
                      <button type="button" onClick={() => setShowCourseForm(null)} className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">ยกเลิก</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Curricula list */}
              {expandedFaculty === faculty.id && (
                <div className="border-t border-gray-100 px-5 py-3">
                  {faculty.curricula.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">ยังไม่มีหลักสูตร</p>
                  ) : (
                    <div className="space-y-1">
                      {faculty.curricula.map(c => (
                        <div key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                          <span className="text-gray-700">
                            {c.programType === 'REGULAR' ? 'ภาคปกติ' : 'นานาชาติ'} {c.curriculumYear}
                          </span>
                          <span className="text-xs text-gray-400">{c._count.courses} วิชา</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
