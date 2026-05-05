import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import Link from 'next/link'
import { GraduationCap, LayoutDashboard, Users, MessageSquare, Flag, Building2, ShieldCheck } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/?error=unauthorized')
  }

  const isSuperAdmin = role === 'SUPER_ADMIN'

  const navItems = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
    { href: '/admin/messages', label: 'ข้อความ', icon: MessageSquare },
    { href: '/admin/reports', label: 'รายงาน', icon: Flag },
    ...(isSuperAdmin ? [{ href: '/admin/faculties', label: 'คณะ/วิชา', icon: Building2 }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-sm text-gray-900">CMU Review</span>
          </Link>
          <div className="mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
