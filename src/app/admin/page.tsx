import { prisma } from '@/lib/prisma'
import { Users, MessageSquare, Star, TrendingUp, DollarSign } from 'lucide-react'

async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalUsers, dailyActiveUsers, totalRatings, totalMessages] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({
      where: { expires: { gte: today } },
    }),
    prisma.difficultyRating.count(),
    prisma.message.count({ where: { isDeleted: false } }),
  ])

  return { totalUsers, dailyActiveUsers, totalRatings, totalMessages }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const cards = [
    {
      label: 'ผู้ใช้ทั้งหมด',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'ผู้ใช้งานวันนี้',
      value: stats.dailyActiveUsers.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'รีวิวทั้งหมด',
      value: stats.totalRatings.toLocaleString(),
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'ข้อความทั้งหมด',
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-sm text-gray-500 mt-0.5">ภาพรวมของระบบ CMU Course Review</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">รายได้ (Coming Soon)</h2>
        </div>
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">ส่วนนี้จะแสดงข้อมูลรายได้ในอนาคต</p>
          <p className="text-gray-300 text-xs mt-1">Revenue analytics placeholder</p>
        </div>
      </div>
    </div>
  )
}
