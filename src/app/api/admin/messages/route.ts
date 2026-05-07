import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER']

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'กรุณาเข้าสู่ระบบก่อน', status: 401, session: null }
  }
  if (!ADMIN_ROLES.includes(session.user.role)) {
    return { error: 'ไม่มีสิทธิ์เข้าถึง', status: 403, session: null }
  }
  return { error: null, status: 200, session }
}

// GET: grouped by course — returns courses that have messages
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId') ?? ''

    if (courseId) {
      // Return messages for a specific course
      const reviewRoom = await prisma.reviewRoom.findUnique({ where: { courseId } })
      if (!reviewRoom) {
        return NextResponse.json({ messages: [] })
      }

      const messages = await prisma.message.findMany({
        where: { roomId: reviewRoom.id, isDeleted: false },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      })

      return NextResponse.json({
        messages: messages.map(m => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          editedAt: m.editedAt?.toISOString() ?? null,
          wasAnonymous: m.wasAnonymous,
          sender: {
            id: m.user.id,
            displayName: m.user.displayName,
            email: m.user.email,
          },
        })),
      })
    }

    // Return courses that have at least one non-deleted message
    const rooms = await prisma.reviewRoom.findMany({
      include: {
        course: { select: { id: true, code: true, nameTh: true } },
        _count: {
          select: { messages: { where: { isDeleted: false } } },
        },
      },
    })

    const coursesWithMessages = rooms
      .filter(r => r._count.messages > 0)
      .map(r => ({
        courseId: r.courseId,
        code: r.course.code,
        nameTh: r.course.nameTh,
        messageCount: r._count.messages,
      }))
      .sort((a, b) => a.code.localeCompare(b.code))

    return NextResponse.json({ courses: coursesWithMessages })
  } catch (err) {
    console.error('GET /api/admin/messages error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
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

    const msg = await prisma.message.findUnique({ where: { id: messageId } })
    if (!msg) {
      return NextResponse.json({ error: 'ไม่พบข้อความ' }, { status: 404 })
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ message: 'ลบข้อความเรียบร้อย' })
  } catch (err) {
    console.error('DELETE /api/admin/messages error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { messageId, content } = body

    if (!messageId || !content?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุ messageId และข้อความ' }, { status: 400 })
    }

    const msg = await prisma.message.findUnique({ where: { id: messageId } })
    if (!msg || msg.isDeleted) {
      return NextResponse.json({ error: 'ไม่พบข้อความ' }, { status: 404 })
    }

    const adminName = session!.user.displayName ?? 'Admin'
    const updatedContent = `${content.trim()} (แก้ไขโดย ${adminName})`

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: updatedContent,
        editedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: updated.id,
      content: updated.content,
      editedAt: updated.editedAt?.toISOString() ?? null,
    })
  } catch (err) {
    console.error('PATCH /api/admin/messages error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
