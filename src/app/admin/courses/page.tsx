'use client'

import { useState, useCallback, useRef } from 'react'
import { BookPlus, Pencil, Trash2, X, AlertTriangle, Search, Upload, Loader2, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

interface CourseItem {
  id: string
  code: string
  name: string
  nameTh: string
  codeEn: string
  codeTh: string
  credits: string
  description: string
  descriptionEn: string
  prerequisite: string
  department: string
  updatedDate: string
  isFreeElective: boolean
  reviewCount: number
}

interface CourseForm {
  code: string
  name: string
  nameTh: string
  codeEn: string
  codeTh: string
  credits: string
  description: string
  descriptionEn: string
  prerequisite: string
  department: string
  updatedDate: string
  isFreeElective: boolean
}

const EMPTY_FORM: CourseForm = {
  code: '', name: '', nameTh: '', codeEn: '', codeTh: '',
  credits: '', description: '', descriptionEn: '',
  prerequisite: '', department: '', updatedDate: '', isFreeElective: false,
}

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'ยืนยัน', danger = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean
}) {
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
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm text-gray-700 hover:bg-gray-50">ยกเลิก</button>
          <button onClick={onConfirm} className={`flex-1 rounded-xl py-2 text-sm font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [form, setForm] = useState<CourseForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void; danger?: boolean; label?: string } | null>(null)

  // CSV upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ message: string; errors?: string[] } | null>(null)

  const fetchCourses = useCallback(async (q: string, fac: string, p: number) => {
    if (!q && !fac) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), audit: 'false' })
      if (q) params.set('q', q)
      if (fac) params.set('faculty', fac)
      const res = await fetch(`/api/admin/courses?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 0)
        setPage(p)
        setSearched(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourses(searchQuery, facultyFilter, 1)
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/courses/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setUploadResult({ message: data.message, errors: data.errors })
        fetchCourses(searchQuery, facultyFilter, 1)
      } else {
        setUploadResult({ message: data.error ?? 'เกิดข้อผิดพลาด' })
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const startEdit = (c: CourseItem) => {
    setForm({ code: c.code, name: c.name, nameTh: c.nameTh, codeEn: c.codeEn, codeTh: c.codeTh, credits: c.credits, description: c.description, descriptionEn: c.descriptionEn, prerequisite: c.prerequisite, department: c.department, updatedDate: c.updatedDate, isFreeElective: c.isFreeElective })
    setEditingId(c.id)
    setShowForm(true)
    setResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const doSave = async () => {
    setSaving(true)
    setResult(null)
    try {
      const isEdit = !!editingId
      const res = await fetch('/api/admin/courses', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { courseId: editingId, ...form } : form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ type: 'success', message: isEdit ? `แก้ไขวิชา ${form.code} เรียบร้อย` : `เพิ่มวิชา ${form.code} เรียบร้อย` })
        setForm(EMPTY_FORM)
        setEditingId(null)
        setShowForm(false)
        fetchCourses(searchQuery, facultyFilter, page)
      } else {
        setResult({ type: 'error', message: data.error ?? 'เกิดข้อผิดพลาด' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirm({
      title: editingId ? 'ยืนยันการแก้ไขวิชา' : 'ยืนยันการเพิ่มวิชา',
      message: `ต้องการ${editingId ? 'แก้ไข' : 'เพิ่ม'}วิชา "${form.nameTh}" (${form.code}) ใช่หรือไม่?`,
      onConfirm: () => { setConfirm(null); doSave() },
    })
  }

  const handleDelete = (c: CourseItem) => {
    setConfirm({
      title: 'ยืนยันการลบวิชา',
      message: `ต้องการลบวิชา "${c.nameTh}" (${c.code}) ออกจากระบบ? ไม่สามารถย้อนกลับได้`,
      label: 'ลบวิชา',
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        setSaving(true)
        try {
          const res = await fetch(`/api/admin/courses?courseId=${c.id}`, { method: 'DELETE' })
          const data = await res.json()
          if (res.ok) {
            setResult({ type: 'success', message: `ลบวิชา ${c.code} เรียบร้อย` })
            fetchCourses(searchQuery, facultyFilter, page)
          } else {
            setResult({ type: 'error', message: data.error ?? 'เกิดข้อผิดพลาด' })
          }
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const F = ({ label, name, value, onChange, placeholder, required, textarea }: { label: string; name: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; textarea?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {textarea ? (
        <textarea name={name} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      ) : (
        <input type="text" name={name} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  )

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} confirmLabel={confirm.label} danger={confirm.danger} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-xl p-2"><BookPlus className="w-5 h-5 text-green-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">จัดการกระบวนวิชา</h1>
            <p className="text-sm text-gray-500">ค้นหาก่อน จึงจะแสดงรายการวิชา</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM) }} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700">
            <BookPlus className="w-4 h-4" /> เพิ่มวิชาใหม่
          </button>
          <label className={`flex items-center gap-2 bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            นำเข้า CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
        </div>
      </div>

      {/* Upload result */}
      {uploadResult && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-3 ${uploadResult.errors?.length ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
          <div>
            <p className="font-medium">{uploadResult.message}</p>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs">{uploadResult.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
            )}
          </div>
          <button onClick={() => setUploadResult(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${result.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {result.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{result.message}</span>
          <button onClick={() => setResult(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">{editingId ? '✏️ แก้ไขวิชา' : '➕ เพิ่มวิชาใหม่'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <F label="รหัสวิชา" name="code" value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder="เช่น 751100" required />
              <F label="หน่วยกิต (เต็ม)" name="credits" value={form.credits} onChange={v => setForm(f => ({ ...f, credits: v }))} placeholder="เช่น 3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="รหัสย่อ (EN)" name="codeEn" value={form.codeEn} onChange={v => setForm(f => ({ ...f, codeEn: v }))} placeholder="เช่น ECON" />
              <F label="รหัสย่อ (TH)" name="codeTh" value={form.codeTh} onChange={v => setForm(f => ({ ...f, codeTh: v }))} placeholder="เช่น เศก" />
            </div>
            <F label="ชื่อวิชา (ภาษาอังกฤษ)" name="name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="เช่น Economics for Everyday Life" required />
            <F label="ชื่อวิชา (ภาษาไทย)" name="nameTh" value={form.nameTh} onChange={v => setForm(f => ({ ...f, nameTh: v }))} placeholder="เช่น เศรษฐศาสตร์ในชีวิตประจำวัน" required />
            <F label="คณะ/หน่วยงาน" name="department" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} placeholder="เช่น คณะเศรษฐศาสตร์" />
            <F label="Prerequisite" name="prerequisite" value={form.prerequisite} onChange={v => setForm(f => ({ ...f, prerequisite: v }))} placeholder="เช่น 751101 หรือ -" />
            <F label="คำอธิบายวิชา (ไทย)" name="description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
            <F label="คำอธิบายวิชา (อังกฤษ)" name="descriptionEn" value={form.descriptionEn} onChange={v => setForm(f => ({ ...f, descriptionEn: v }))} textarea />
            <div className="grid grid-cols-2 gap-4">
              <F label="วันที่อัปเดต" name="updatedDate" value={form.updatedDate} onChange={v => setForm(f => ({ ...f, updatedDate: v }))} placeholder="เช่น 01/01/2567" />
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl mt-5">
                <input type="checkbox" id="isFreeElective" checked={form.isFreeElective} onChange={e => setForm(f => ({ ...f, isFreeElective: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded" />
                <label htmlFor="isFreeElective" className="text-sm font-medium text-purple-800 cursor-pointer">วิชาเลือกเสรี</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มกระบวนวิชา'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }} className="px-4 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ค้นหารหัสวิชา, ชื่อวิชา, รหัสย่อ..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input type="text" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)} placeholder="กรองตามคณะ..." className="w-48 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            ค้นหา
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">กรอกคำค้นหาแล้วกด &quot;ค้นหา&quot; เพื่อแสดงรายการวิชา (แสดงหน้าละ 50 รายการ)</p>
      </div>

      {/* Results */}
      {!searched && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">กรอกคำค้นหาด้านบนเพื่อแสดงรายการวิชา</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังค้นหา...
        </div>
      )}

      {searched && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">ผลการค้นหา</h2>
              <p className="text-xs text-gray-400 mt-0.5">พบ {total} วิชา (หน้า {page}/{totalPages || 1})</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">ไม่พบวิชาที่ตรงกับคำค้นหา</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อวิชา</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">คณะ/หน่วยงาน</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วยกิต</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">อัปเดต</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.map(c => (
                    <tr key={c.id} className={`hover:bg-gray-50 ${editingId === c.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-blue-600 font-semibold">{c.code}</p>
                        {c.codeEn && c.codeEn !== '-' && <p className="text-xs text-gray-400">{c.codeEn}</p>}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-gray-900 text-xs line-clamp-1">{c.nameTh}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{c.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {c.department && c.department !== '-' ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c.department}</span>
                        ) : <span className="text-xs text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.credits || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.updatedDate || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(c)} disabled={saving} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30" title="ลบ">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">แสดง {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} จาก {total} รายการ</p>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchCourses(searchQuery, facultyFilter, page - 1)} disabled={page === 1 || loading} className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">หน้า {page} / {totalPages}</span>
                <button onClick={() => fetchCourses(searchQuery, facultyFilter, page + 1)} disabled={page === totalPages || loading} className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
