import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'กรุณาระบุ courseId' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    await prisma.courseViewLog.create({
      data: {
        courseId,
        userId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/logs/view error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
