'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, X, Filter } from 'lucide-react'

interface AdminMessage {
  id: string
  content: string
  createdAt: string
  sender: { id: string; displayName: string; email: string }
  course: { id: string; code: string; nameTh: string }
}

interface MessagesResponse {
  messages: AdminMessage[]
  total: number
  page: number
  totalPages: number
}

interface Course {
  id: string
  code: string
  nameTh: string
}

export default function AdminMessagesPage() {
  const [data, setData] = useState<MessagesResponse | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchMessages = useCallback(async (courseId: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (courseId) params.set('courseId', courseId)
      const res = await fetch(`/api/admin/messages?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch courses for filter
    fetch('/api/courses').then(r => r.json()).then(d => {
      setCourses(d.courses ?? [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchMessages(selectedCourse, page)
  }, [selectedCourse, page, fetchMessages])

  const handleDelete = async (messageId: string) => {
    if (!confirm('ยืนยันการลบข้อความนี้?')) return
    setActionLoading(messageId)
    try {
      const res = await fetch(`/api/admin/messages?messageId=${messageId}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage('ลบข้อความเรียบร้อย')
        fetchMessages(selectedCourse, page)
      } else {
        const d = await res.json()
        setMessage(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">จัดการข้อความ</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data ? `${data.total} ข้อความทั้งหมด` : 'กำลังโหลด...'}
        </p>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Course filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={selectedCourse}
          onChange={e => { setSelectedCourse(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">ทุกวิชา</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.nameTh}
            </option>
          ))}
        </select>
      </div>

      {/* Messages table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ข้อความ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ผู้ส่ง</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">วิชา</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">เวลา</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.messages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      ไม่มีข้อความ
                    </td>
                  </tr>
                )}
                {data?.messages.map(msg => (
                  <tr key={msg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-900 line-clamp-2">{msg.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{msg.sender.displayName}</p>
                      <p className="text-xs text-gray-500">{msg.sender.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-blue-600">{msg.course.code}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{msg.course.nameTh}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString('th-TH', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(msg.id)}
                        disabled={actionLoading === msg.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="ลบข้อความ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-600">หน้า {page} / {data.totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  )
}
