import { prisma } from '@/lib/prisma'
import { Flag } from 'lucide-react'

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    include: {
      user: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const STAR_COLORS: Record<number, string> = {
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-blue-500',
    5: 'text-green-500',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">รายงานปัญหา</h1>
        <p className="text-sm text-gray-500 mt-0.5">{reports.length} รายงานล่าสุด</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Flag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">ยังไม่มีรายงาน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {report.user ? report.user.displayName : 'ผู้เยี่ยมชม (Guest)'}
                  </p>
                  {report.user && (
                    <p className="text-xs text-gray-500">{report.user.email}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${STAR_COLORS[report.systemRating] ?? 'text-gray-500'}`}>
                    {'★'.repeat(report.systemRating)}{'☆'.repeat(5 - report.systemRating)}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(report.createdAt).toLocaleString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                {report.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
