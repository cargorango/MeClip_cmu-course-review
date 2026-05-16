import { prisma } from '@/lib/prisma'
import { Users, UserCheck, BookOpen, MessageSquare, Star, TrendingUp, Activity } from 'lucide-react'

async function getStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalCourses,
    totalMessages,
    totalRatings,
    adminCount,
    roleBreakdown,
    recentViewLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.course.count(),
    prisma.message.count({ where: { isDeleted: false } }),
    prisma.difficultyRating.count(),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER'] } } }),
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
    prisma.courseViewLog.findMany({
      where: { createdAt: { gte: fifteenMinAgo } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ])

  const onlineUsers = recentViewLogs.length

  return {
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalCourses,
    totalMessages,
    totalRatings,
    adminCount,
    roleBreakdown,
    onlineUsers,
  }
}

export default async function AdminStatsPage() {
  const stats = await getStats()

  const mainCards = [
    {
      label: 'ผู้ใช้ทั้งหมด',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'สมัครวันนี้',
      value: stats.newUsersToday.toLocaleString(),
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      label: 'สมัคร 7 วันล่าสุด',
      value: stats.newUsersWeek.toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: 'สมัคร 30 วันล่าสุด',
      value: stats.newUsersMonth.toLocaleString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
  ]

  const systemCards = [
    {
      label: 'กระบวนวิชาในระบบ',
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'ข้อความในห้องรีวิว',
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
    {
      label: 'การให้คะแนนวิชา',
      value: stats.totalRatings.toLocaleString(),
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'ผู้ดูแลระบบ',
      value: stats.adminCount.toLocaleString(),
      icon: Users,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'ผู้ใช้งานอยู่ในระบบตอนนี้',
      value: stats.onlineUsers.toLocaleString(),
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      note: '(15 นาทีที่ผ่านมา)',
    },
  ]

  const roleMap: Record<string, string> = {
    STUDENT: 'นักศึกษา / ทั่วไป',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
    PLATFORM_MANAGER: 'Platform Manager',
    SYSTEM_MANAGER: 'System Manager',
    OPERATIONS_MANAGER: 'Operations Manager',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">ยอดผู้ใช้งาน</h1>
        <p className="text-sm text-gray-500 mt-0.5">สถิติผู้ใช้งานในระบบ CMU Course Review</p>
      </div>

      {/* User stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">ผู้ใช้งาน</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mainCards.map(card => (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border ?? 'border-gray-200'} p-5`}>
              <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">ระบบ</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {systemCards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              {'note' in card && card.note && (
                <p className="text-xs text-gray-400 mt-0.5">{card.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">สัดส่วนตามสิทธิ์</h2>
        <div className="space-y-3">
          {stats.roleBreakdown.map(r => {
            const pct = Math.round((r._count.role / stats.totalUsers) * 100)
            return (
              <div key={r.role}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{roleMap[r.role] ?? r.role}</span>
                  <span className="text-gray-500">{r._count.role.toLocaleString()} คน ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
