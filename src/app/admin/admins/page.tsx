'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, ShieldOff, UserPlus, X, Loader2 } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  displayName: string
  role: string
}

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER']

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_MANAGER: 'Platform Manager',
  SYSTEM_MANAGER: 'System Manager',
  OPERATIONS_MANAGER: 'Operations Manager',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  PLATFORM_MANAGER: 'bg-red-100 text-red-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  SYSTEM_MANAGER: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  OPERATIONS_MANAGER: 'bg-yellow-100 text-yellow-700',
}

export default function AdminManagementPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true)
    try {
      const res = await fetch('/api/admin/users?role=admin')
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.users.filter((u: AdminUser) => ADMIN_ROLES.includes(u.role)))
      }
    } finally {
      setLoadingAdmins(false)
    }
  }, [])

  // Get current user's role from session
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => setCurrentUserRole(d.role ?? ''))
      .catch(() => {})
    fetchAdmins()
  }, [fetchAdmins])

  const isPlatformManager = currentUserRole === 'PLATFORM_MANAGER' || currentUserRole === 'SUPER_ADMIN'

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage(null)

    try {
      const searchRes = await fetch(`/api/admin/users?q=${encodeURIComponent(email.trim())}`)
      if (!searchRes.ok) throw new Error('ค้นหาผู้ใช้ไม่สำเร็จ')
      const searchData = await searchRes.json()
      const user = searchData.users?.find((u: AdminUser) => u.email.toLowerCase() === email.trim().toLowerCase())

      if (!user) {
        setMessage({ type: 'error', text: `ไม่พบผู้ใช้ที่มี email: ${email.trim()}` })
        return
      }

      if (user.role === 'PLATFORM_MANAGER' || user.role === 'SUPER_ADMIN') {
        setMessage({ type: 'error', text: 'ไม่สามารถเปลี่ยนสิทธิ์ Platform Manager ได้' })
        return
      }

      if (ADMIN_ROLES.includes(user.role)) {
        setMessage({ type: 'error', text: `${email.trim()} เป็น Admin อยู่แล้ว` })
        return
      }

      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'grant' }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `มอบสิทธิ์ Admin ให้ ${email.trim()} เรียบร้อยแล้ว` })
        setEmail('')
        fetchAdmins()
      } else {
        setMessage({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' })
      }
    } catch {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (userId: string, userEmail: string) => {
    if (!confirm(`ยืนยันการถอนสิทธิ์ Admin จาก ${userEmail}?`)) return
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'revoke' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `ถอนสิทธิ์ Admin จาก ${userEmail} เรียบร้อยแล้ว` })
        fetchAdmins()
      } else {
        setMessage({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'change_role', newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `เปลี่ยน role เรียบร้อยแล้ว` })
        fetchAdmins()
      } else {
        setMessage({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' })
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-orange-100 rounded-xl p-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">จัดการผู้ดูแลระบบ</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">เพิ่มหรือถอนสิทธิ์ Admin ผ่าน Email</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grant admin form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">เพิ่ม Admin ใหม่</h2>
        <form onSubmit={handleGrant} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="กรอก Email ของผู้ใช้..."
            required
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            เพิ่ม Admin
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          ผู้ใช้ต้องเคย login เข้าระบบก่อนจึงจะสามารถมอบสิทธิ์ได้
        </p>
      </div>

      {/* Current admins list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">ผู้ดูแลระบบปัจจุบัน</h2>
        </div>

        {loadingAdmins ? (
          <div className="p-8 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">ไม่มีข้อมูล</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map(admin => {
              const isPM = admin.role === 'PLATFORM_MANAGER' || admin.role === 'SUPER_ADMIN'
              return (
                <div key={admin.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{admin.displayName}</p>
                    <p className="text-xs text-gray-500">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[admin.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[admin.role] ?? admin.role}
                    </span>

                    {/* Platform Manager can change role of non-PM admins */}
                    {isPlatformManager && !isPM && (
                      <select
                        value={admin.role}
                        onChange={e => handleChangeRole(admin.id, e.target.value)}
                        disabled={actionLoading === admin.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="SYSTEM_MANAGER">System Manager</option>
                        <option value="OPERATIONS_MANAGER">Operations Manager</option>
                        <option value="ADMIN">Admin (Legacy)</option>
                      </select>
                    )}

                    {/* Revoke button for non-PM admins */}
                    {isPlatformManager && !isPM && (
                      <button
                        onClick={() => handleRevoke(admin.id, admin.email)}
                        disabled={actionLoading === admin.id}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === admin.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldOff className="w-3 h-3" />
                        )}
                        ถอนสิทธิ์
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
