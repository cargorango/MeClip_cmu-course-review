import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { content, systemRating } = body

    // Validate content
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกรายละเอียดปัญหา' },
        { status: 400 }
      )
    }

    // Validate rating
    if (!systemRating || ![1, 2, 3, 4, 5].includes(systemRating)) {
      return NextResponse.json(
        { error: 'กรุณาให้คะแนนระบบ (1-5)' },
        { status: 400 }
      )
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        userId: session?.user?.id ?? null,
        content: content.trim(),
        systemRating,
      },
    })

    return NextResponse.json({
      id: report.id,
      message: 'ขอบคุณสำหรับความคิดเห็น',
    })
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
