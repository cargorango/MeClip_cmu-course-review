import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeGradeStats } from '@/lib/grade-stats'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params

    const reviewRoom = await prisma.reviewRoom.findUnique({ where: { courseId } })
    if (!reviewRoom) {
      return NextResponse.json({ stats: null })
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId: reviewRoom.id,
        isDeleted: false,
      },
      select: { grade: true },
    })

    const grades = messages.map((m) => m.grade)
    const stats = computeGradeStats(grades)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('GET /api/stats/grade/[courseId] error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
