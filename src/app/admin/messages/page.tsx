'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, Pencil, X, ChevronDown, ChevronRight, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'

interface CourseGroup {
  courseId: string
  code: string
  nameTh: string
  messageCount: number
}

interface AdminMessage {
  id: string
  content: string
  createdAt: string
  editedAt: string | null
  wasAnonymous: boolean | null
  sender: { id: string; displayName: string; email: string }
}

// Confirm dialog component
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
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
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-xl py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2 text-sm font-medium text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit modal component
function EditModal({
  message,
  onSave,
  onClose,
}: {
  message: AdminMessage
  onSave: (id: string, content: string) => Promise<void>
  onClose: () => void
}) {
  const [content, setContent] = useState(message.content)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave(message.id, content.trim())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">แก้ไขข้อความ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          ผู้ส่ง: {message.sender.displayName} ({message.sender.email})
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="ข้อความ..."
        />
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ ระบบจะเพิ่มข้อความ &quot;(แก้ไขโดย Admin)&quot; ต่อท้ายอัตโนมัติ
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-xl py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}

// Course accordion row
function CourseRow({ course, onRefresh }: { course: CourseGroup; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<AdminMessage | null>(null)
  const [editMessage, setEditMessage] = useState<AdminMessage | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/messages?courseId=${course.courseId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [course.courseId])

  const handleToggle = () => {
    if (!expanded) fetchMessages()
    setExpanded(v => !v)
  }

  const handleDelete = async (msg: AdminMessage) => {
    setActionLoading(msg.id)
    try {
      const res = await fetch(`/api/admin/messages?messageId=${msg.id}`, { method: 'DELETE' })
      if (res.ok) {
        setToast('ลบข้อความเรียบร้อย')
        setMessages(prev => prev.filter(m => m.id !== msg.id))
        onRefresh()
      } else {
        const d = await res.json()
        setToast(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setActionLoading(null)
      setConfirmDelete(null)
    }
  }

  const handleEdit = async (id: string, content: string) => {
    const res = await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: id, content }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error ?? 'เกิดข้อผิดพลาด')
    }
    const updated = await res.json()
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: updated.content, editedAt: updated.editedAt } : m))
    setToast('แก้ไขข้อความเรียบร้อย')
  }

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title="ยืนยันการลบข้อความ"
          message={`ต้องการลบข้อความ "${confirmDelete.content.slice(0, 50)}..." ใช่หรือไม่?`}
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {editMessage && (
        <EditModal
          message={editMessage}
          onSave={handleEdit}
          onClose={() => setEditMessage(null)}
        />
      )}

      {/* Course header row */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <div>
              <span className="text-sm font-semibold text-blue-600">{course.code}</span>
              <span className="text-sm text-gray-700 ml-2">{course.nameTh}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {course.messageCount} รีวิว
            </span>
          </div>
        </button>

        {/* Expanded messages */}
        {expanded && (
          <div className="border-t border-gray-100">
            {toast && (
              <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 flex items-center justify-between">
                {toast}
                <button onClick={() => setToast('')}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {loading ? (
              <div className="p-6 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังโหลด...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">ไม่มีข้อความ</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map(msg => (
                  <div key={msg.id} className="px-5 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-relaxed">{msg.content}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {msg.wasAnonymous ? '🔒 ไม่ระบุตัวตน' : msg.sender.displayName}
                          </span>
                          {!msg.wasAnonymous && (
                            <span className="text-xs text-gray-400">{msg.sender.email}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleString('th-TH', {
                              day: 'numeric', month: 'short', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {msg.editedAt && (
                            <span className="text-xs text-amber-600">(แก้ไขแล้ว)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditMessage(msg)}
                          disabled={actionLoading === msg.id}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไขข้อความ"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(msg)}
                          disabled={actionLoading === msg.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="ลบข้อความ"
                        >
                          {actionLoading === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function AdminMessagesPage() {
  const [courses, setCourses] = useState<CourseGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/messages')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses ?? [])
      } else {
        const d = await res.json()
        setError(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">จัดการข้อความรีวิว</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? 'กำลังโหลด...' : `${courses.length} วิชาที่มีรีวิว`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลด...
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ยังไม่มีข้อความรีวิวในระบบ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <CourseRow
              key={course.courseId}
              course={course}
              onRefresh={fetchCourses}
            />
          ))}
        </div>
      )}
    </div>
  )
}
