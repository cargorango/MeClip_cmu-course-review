import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'กรุณาเข้าสู่ระบบก่อน', status: 401 }
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return { error: 'ไม่มีสิทธิ์เข้าถึง', status: 403 }
  }
  return { error: null, status: 200 }
}

export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 50
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { isDeleted: false }
    if (courseId) {
      const reviewRoom = await prisma.reviewRoom.findUnique({ where: { courseId } })
      if (reviewRoom) {
        where.roomId = reviewRoom.id
      } else {
        return NextResponse.json({ messages: [], total: 0, page, totalPages: 0 })
      }
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          room: {
            include: {
              course: { select: { id: true, code: true, nameTh: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ])

    return NextResponse.json({
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: {
          id: m.user.id,
          displayName: m.user.displayName,
          email: m.user.email,
        },
        course: {
          id: m.room.course.id,
          code: m.room.course.code,
          nameTh: m.room.course.nameTh,
        },
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/messages error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'กรุณาระบุ messageId' }, { status: 400 })
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message) {
      return NextResponse.json({ error: 'ไม่พบข้อความ' }, { status: 404 })
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ message: 'ลบข้อความเรียบร้อย' })
  } catch (error) {
    console.error('DELETE /api/admin/messages error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
