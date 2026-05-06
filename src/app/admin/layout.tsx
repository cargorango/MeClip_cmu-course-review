import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import Link from 'next/link'
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
    ...(isSuperAdmin
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
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
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
              <p className="text-xs text-orange-500 truncate max-w-[140px]">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
            >
              <div className="bg-gray-100 group-hover:bg-white rounded-lg p-1.5 transition-colors">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium leading-tight">{item.label}</p>
                <p className="text-xs text-gray-400 leading-tight">{item.sublabel}</p>
              </div>
            </Link>
          ))}
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

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
