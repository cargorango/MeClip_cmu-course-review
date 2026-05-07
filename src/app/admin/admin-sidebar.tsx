'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  MessageSquare,
  BookPlus,
  ShieldCheck,
  BarChart3,
  Flag,
  ArrowLeft,
} from 'lucide-react'

interface AdminSidebarProps {
  role: string
  isOperationsManager: boolean
  email: string
}

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_MANAGER: 'Platform Manager',
  SYSTEM_MANAGER: 'System Manager',
  OPERATIONS_MANAGER: 'Operations Manager',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
}

export default function AdminSidebar({ role, isOperationsManager, email }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin',
      label: 'หน้าหลัก',
      sublabel: 'สถิติระบบ',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/users',
      label: 'จัดการผู้ใช้',
      sublabel: 'ดู/แก้ไข/ลบ',
      icon: Users,
    },
    {
      href: '/admin/messages',
      label: 'แชทรีวิว',
      sublabel: 'ดูและลบข้อความ',
      icon: MessageSquare,
    },
    {
      href: '/admin/courses',
      label: 'จัดการวิชา',
      sublabel: 'เพิ่มกระบวนวิชา',
      icon: BookPlus,
    },
    // Only show "จัดการ Admin" for Platform Manager and System Manager (not Operations Manager)
    ...(!isOperationsManager
      ? [
          {
            href: '/admin/admins',
            label: 'จัดการ Admin',
            sublabel: 'เพิ่ม/ถอนสิทธิ์',
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      href: '/admin/stats',
      label: 'ยอดผู้ใช้',
      sublabel: 'สถิติผู้ใช้งาน',
      icon: BarChart3,
    },
    {
      href: '/admin/reports',
      label: 'แจ้งปัญหา',
      sublabel: 'Feedback & ดาว',
      icon: Flag,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 fixed h-full z-30">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-sm text-gray-900">CMU Course Review</span>
        </Link>
        <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-orange-700">
              {ROLE_LABELS[role] ?? 'Admin'}
            </p>
            <p className="text-xs text-orange-500 truncate max-w-[140px]">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors group ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div
                className={`rounded-lg p-1.5 transition-colors ${
                  active
                    ? 'bg-blue-100'
                    : 'bg-gray-100 group-hover:bg-white'
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? 'text-blue-600' : ''}`} />
              </div>
              <div>
                <p className={`font-medium leading-tight ${active ? 'text-blue-700' : ''}`}>
                  {item.label}
                </p>
                <p className={`text-xs leading-tight ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.sublabel}
                </p>
              </div>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="p-3 border-t border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าเว็บ
        </Link>
      </div>
    </aside>
  )
}
