'use client'

import { useState } from 'react'
import { BookPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface CourseForm {
  code: string
  name: string
  nameTh: string
  credits: string
  description: string
}

const EMPTY_FORM: CourseForm = {
  code: '',
  name: '',
  nameTh: '',
  credits: '',
  description: '',
}

export default function AdminCoursesPage() {
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ type: 'success', message: `เพิ่มวิชา ${form.nameTh} (${form.code}) เรียบร้อยแล้ว` })
        setForm(EMPTY_FORM)
      } else {
        setResult({ type: 'error', message: data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
      }
    } catch {
      setResult({ type: 'error', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-green-100 rounded-xl p-2">
            <BookPlus className="w-5 h-5 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">จัดการกระบวนวิชา</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">เพิ่มกระบวนวิชาใหม่เข้าสู่ระบบ</p>
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`flex items-start gap-3 rounded-xl px-4 py-3 mb-6 text-sm ${
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
          {result.message}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              หน่วยกิต
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              คำอธิบายวิชา
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="อธิบายเนื้อหาและวัตถุประสงค์ของวิชา..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
              ) : (
                <>
                  <BookPlus className="w-4 h-4" />
                  เพิ่มกระบวนวิชา
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setForm(EMPTY_FORM); setResult(null) }}
              className="px-4 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ล้างข้อมูล
            </button>
          </div>
        </form>
      </div>

      {/* Info box */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
        <p className="font-medium mb-1">หมายเหตุ</p>
        <ul className="space-y-0.5 text-blue-600">
          <li>• วิชาที่เพิ่มจะถูกจัดอยู่ในหมวดวิชาเลือกเสรีโดยอัตโนมัติ</li>
          <li>• รหัสวิชาต้องไม่ซ้ำกับที่มีอยู่ในระบบ</li>
          <li>• ชื่อวิชาภาษาไทยและอังกฤษเป็นข้อมูลบังคับ</li>
        </ul>
      </div>
    </div>
  )
}
