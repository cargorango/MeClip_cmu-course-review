'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Trash2, Edit2, Check, X, Shield, ShieldOff, Mail } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  displayName: string
  role: string
  reviewerLevel: string
  totalRatings: number
  createdAt: string
  isAnonymous: boolean
}

interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

interface AdminUsersClientProps {
  isPlatformManager: boolean
  isOperationsManager: boolean
}

export default function AdminUsersClient({ isPlatformManager, isOperationsManager }: AdminUsersClientProps) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<'name' | 'email'>('name')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(query, page)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, page, fetchUsers])

  const handleUpdateName = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName: editName }),
      })
      if (res.ok) {
        setMessage('อัปเดตชื่อเรียบร้อย')
        setEditingId(null)
        fetchUsers(query, page)
      } else {
        const d = await res.json()
        setMessage(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateEmail = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: editEmail }),
      })
      if (res.ok) {
        setMessage('อัปเดต Email เรียบร้อย')
        setEditingId(null)
        fetchUsers(query, page)
      } else {
        const d = await res.json()
        setMessage(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('ยืนยันการลบบัญชีผู้ใช้นี้?')) return
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage('ลบบัญชีเรียบร้อย')
        fetchUsers(query, page)
      } else {
        const d = await res.json()
        setMessage(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (userId: string, action: 'grant' | 'revoke') => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      if (res.ok) {
        setMessage(action === 'grant' ? 'มอบสิทธิ์ Admin เรียบร้อย' : 'ถอนสิทธิ์ Admin เรียบร้อย')
        fetchUsers(query, page)
      } else {
        const d = await res.json()
        setMessage(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const LEVEL_COLORS: Record<string, string> = {
    'เริ่มรีวิว': 'bg-green-100 text-green-700',
    'มีประสบการณ์': 'bg-blue-100 text-blue-700',
    'ตำนานมหาลัย': 'bg-purple-100 text-purple-700',
  }

  const ROLE_COLORS: Record<string, string> = {
    STUDENT: 'bg-gray-100 text-gray-600',
    ADMIN: 'bg-orange-100 text-orange-700',
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    PLATFORM_MANAGER: 'bg-red-100 text-red-700',
    SYSTEM_MANAGER: 'bg-orange-100 text-orange-700',
    OPERATIONS_MANAGER: 'bg-yellow-100 text-yellow-700',
  }

  const isAdminRole = (role: string) =>
    ['ADMIN', 'SUPER_ADMIN', 'PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER'].includes(role)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data ? `${data.total} ผู้ใช้ทั้งหมด` : 'กำลังโหลด...'}
        </p>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1) }}
          placeholder="ค้นหาด้วย email..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ผู้ใช้</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ระดับ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">สิทธิ์</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่สมัคร</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingId === user.id && editField === 'name' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleUpdateName(user.id)}
                            disabled={!!actionLoading}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : editingId === user.id && editField === 'email' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleUpdateEmail(user.id)}
                            disabled={!!actionLoading}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900">{user.displayName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[user.reviewerLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.reviewerLevel}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{user.totalRatings} รีวิว</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingId(user.id); setEditField('name'); setEditName(user.displayName) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไขชื่อ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => { setEditingId(user.id); setEditField('email'); setEditEmail(user.email) }}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="แก้ไข Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Role management (Platform Manager only) */}
                        {isPlatformManager && !isAdminRole(user.role) && (
                          <button
                            onClick={() => handleRoleChange(user.id, 'grant')}
                            disabled={!!actionLoading}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="มอบสิทธิ์ Admin"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isPlatformManager && isAdminRole(user.role) && user.role !== 'PLATFORM_MANAGER' && (
                          <button
                            onClick={() => handleRoleChange(user.id, 'revoke')}
                            disabled={!!actionLoading}
                            className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="ถอนสิทธิ์ Admin"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete button — hidden for OPERATIONS_MANAGER */}
                        {!isOperationsManager && !user.email.endsWith('@deleted.invalid') && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={!!actionLoading || user.role === 'PLATFORM_MANAGER'}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                            title="ลบบัญชี"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
          <span className="text-sm text-gray-600">
            หน้า {page} / {data.totalPages}
          </span>
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
