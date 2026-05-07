'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookPlus, CheckCircle, XCircle, Loader2, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'

interface CourseForm {
  code: string
  name: string
  nameTh: string
  credits: string
  description: string
  isFreeElective: boolean
}

interface CourseItem {
  id: string
  code: string
  name: string
  nameTh: string
  credits: string
  description: string
  isFreeElective: boolean
  reviewCount: number
  createdAt: string
}

interface AuditLogItem {
  id: string
  action: string
  createdAt: string
  course: { id: string; code: string; nameTh: string }
  admin: { id: string; displayName: string; email: string }
}

const EMPTY_FORM: CourseForm = {
  code: '',
  name: '',
  nameTh: '',
  credits: '',
  description: '',
  isFreeElective: false,
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'เพิ่มวิชา',
  UPDATE: 'แก้ไขวิชา',
  DELETE: 'ลบวิชา',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
}

interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'ยืนยัน', danger = false }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-xl py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2 text-sm font-medium text-white transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCoursesPage() {
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    onConfirm: () => void
    danger?: boolean
    confirmLabel?: string
  } | null>(null)

  const fetchData = useCallback(async (q?: string) => {
    setLoadingData(true)
    try {
      const params = new URLSearchParams({ audit: 'true' })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/courses?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses)
        setAuditLogs(data.auditLogs)
      }
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    // Only load audit logs initially, not all courses
    fetchData()
  }, [fetchData])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setResult(null)
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, isFreeElective: e.target.checked }))
    setResult(null)
  }

  const startEdit = (course: CourseItem) => {
    setEditingCourseId(course.id)
    setForm({
      code: course.code,
      name: course.name,
      nameTh: course.nameTh,
      credits: course.credits,
      description: course.description,
      isFreeElective: course.isFreeElective,
    })
    setResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingCourseId(null)
    setForm(EMPTY_FORM)
    setResult(null)
  }

  const doSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const isEdit = !!editingCourseId
      const res = await fetch('/api/admin/courses', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { courseId: editingCourseId, ...form } : form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({
          type: 'success',
          message: isEdit
            ? `แก้ไขวิชา ${form.nameTh} (${form.code}) เรียบร้อยแล้ว`
            : `เพิ่มวิชา ${form.nameTh} (${form.code}) เรียบร้อยแล้ว`,
        })
        setForm(EMPTY_FORM)
        setEditingCourseId(null)
        fetchData(searchQuery)
      } else {
        setResult({ type: 'error', message: data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
      }
    } catch {
      setResult({ type: 'error', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isEdit = !!editingCourseId
    setConfirmDialog({
      title: isEdit ? 'ยืนยันการแก้ไขวิชา' : 'ยืนยันการเพิ่มวิชา',
      message: isEdit
        ? `ต้องการแก้ไขวิชา "${form.nameTh}" (${form.code}) ใช่หรือไม่? โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน`
        : `ต้องการเพิ่มวิชา "${form.nameTh}" (${form.code}) ใช่หรือไม่? โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน`,
      onConfirm: () => { setConfirmDialog(null); doSubmit() },
    })
  }

  const handleDelete = (course: CourseItem) => {
    setConfirmDialog({
      title: 'ยืนยันการลบวิชา',
      message: `ต้องการลบวิชา "${course.nameTh}" (${course.code}) ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      confirmLabel: 'ลบวิชา',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setLoading(true)
        try {
          const res = await fetch(`/api/admin/courses?courseId=${course.id}`, { method: 'DELETE' })
          const data = await res.json()
          if (res.ok) {
            setResult({ type: 'success', message: `ลบวิชา ${course.nameTh} เรียบร้อยแล้ว` })
            fetchData(searchQuery)
          } else {
            setResult({ type: 'error', message: data.error ?? 'เกิดข้อผิดพลาด' })
          }
        } catch {
          setResult({ type: 'error', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
        } finally {
          setLoading(false)
        }
      },
    })
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmLabel={confirmDialog.confirmLabel}
          danger={confirmDialog.danger}
        />
      )}

      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-green-100 rounded-xl p-2">
            <BookPlus className="w-5 h-5 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">จัดการกระบวนวิชา</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">เพิ่มหรือแก้ไขกระบวนวิชาในระบบ</p>
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
            result.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          )}
          <span className="flex-1">{result.message}</span>
          <button onClick={() => setResult(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {editingCourseId ? '✏️ แก้ไขกระบวนวิชา' : '➕ เพิ่มกระบวนวิชาใหม่'}
          </h2>
          {editingCourseId && (
            <button
              onClick={cancelEdit}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิกการแก้ไข
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              รหัสวิชา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="เช่น 751100"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Name (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ชื่อวิชา (ภาษาอังกฤษ) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="เช่น Economics for Everyday Life"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Name (Thai) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ชื่อวิชา (ภาษาไทย) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nameTh"
              value={form.nameTh}
              onChange={handleChange}
              placeholder="เช่น เศรษฐศาสตร์ในชีวิตประจำวัน"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Credits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หน่วยกิต</label>
            <input
              type="text"
              name="credits"
              value={form.credits}
              onChange={handleChange}
              placeholder="เช่น 3 (3-0-6)"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">คำอธิบายวิชา</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="อธิบายเนื้อหาและวัตถุประสงค์ของวิชา..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Free Elective Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
            <input
              type="checkbox"
              id="isFreeElective"
              checked={form.isFreeElective}
              onChange={handleCheckbox}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isFreeElective" className="text-sm font-medium text-purple-800 cursor-pointer">
              วิชาเลือกเสรี
            </label>
            <span className="text-xs text-purple-500">
              (วิชาจะแสดงในหมวดวิชาเลือกเสรี)
            </span>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : editingCourseId ? (
                <>
                  <Pencil className="w-4 h-4" />
                  บันทึกการแก้ไข
                </>
              ) : (
                <>
                  <BookPlus className="w-4 h-4" />
                  เพิ่มกระบวนวิชา
                </>
              )}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ล้างข้อมูล
            </button>
          </div>
        </form>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
        <p className="font-medium mb-1">หมายเหตุ</p>
        <ul className="space-y-0.5 text-blue-600">
          <li>• วิชาที่เพิ่มจะถูกจัดอยู่ในหมวดวิชาตามที่ท่านกำหนด</li>
          <li>• รหัสวิชาต้องไม่ซ้ำกับที่มีอยู่ในระบบ</li>
          <li>• ชื่อวิชาภาษาไทยและอังกฤษเป็นข้อมูลบังคับ</li>
          <li className="font-medium text-blue-700">• โปรดตรวจสอบให้ละเอียดก่อนเพิ่มกระบวนวิชา</li>
        </ul>
      </div>

      {/* Course list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">รายการวิชาทั้งหมด</h2>
            <p className="text-xs text-gray-400 mt-0.5">{courses.length} วิชา</p>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัสหรือชื่อวิชา..."
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        {loadingData ? (
          <div className="p-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">ยังไม่มีวิชาในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อวิชา</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วยกิต</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">หมวด</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">รีวิว</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map(course => (
                  <tr key={course.id} className={`hover:bg-gray-50 ${editingCourseId === course.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{course.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs">{course.nameTh}</p>
                      <p className="text-xs text-gray-400">{course.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{course.credits || '-'}</td>
                    <td className="px-4 py-3">
                      {course.isFreeElective ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">เลือกเสรี</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">ทั่วไป</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{course.reviewCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(course)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(course)}
                          disabled={loading}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">ประวัติการจัดการวิชา</h2>
          <p className="text-xs text-gray-400 mt-0.5">50 รายการล่าสุด</p>
        </div>
        {loadingData ? (
          <div className="p-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">ยังไม่มีประวัติ</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.course.code} — {log.course.nameTh}
                    </p>
                    <p className="text-xs text-gray-500">โดย {log.admin.displayName} ({log.admin.email})</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 shrink-0 ml-4">
                  {new Date(log.createdAt).toLocaleString('th-TH', {
                    day: 'numeric', month: 'short', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
