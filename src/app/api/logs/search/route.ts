import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, courseId } = body

    if (!query || typeof query !== 'string' || query.length < 2) {
      return NextResponse.json({ error: 'query ต้องมีความยาวอย่างน้อย 2 ตัวอักษร' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    await prisma.courseSearchLog.create({
      data: {
        query,
        courseId: courseId ?? null,
        userId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/logs/search error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
