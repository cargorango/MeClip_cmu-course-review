import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: 'กรุณาระบุ messageId' }, { status: 400 })
    }

    const userId = session.user.id

    const result = await prisma.$transaction(async (tx) => {
      // Check message exists and is not deleted
      const message = await tx.message.findUnique({
        where: { id: messageId },
        select: { id: true, isDeleted: true },
      })

      if (!message || message.isDeleted) {
        return null
      }

      // Check if like already exists
      const existingLike = await tx.messageLike.findUnique({
        where: { messageId_userId: { messageId, userId } },
      })

      if (existingLike) {
        // Delete the like (toggle off)
        await tx.messageLike.delete({
          where: { messageId_userId: { messageId, userId } },
        })
      } else {
        // Create the like (toggle on)
        await tx.messageLike.create({
          data: { messageId, userId },
        })
      }

      // Get updated count
      const count = await tx.messageLike.count({ where: { messageId } })

      return { liked: !existingLike, count }
    })

    if (result === null) {
      return NextResponse.json({ error: 'ไม่พบข้อความ' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/messages/likes error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'กรุณาระบุ messageId' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    const count = await prisma.messageLike.count({ where: { messageId } })

    let likedByUser = false
    if (userId) {
      const like = await prisma.messageLike.findUnique({
        where: { messageId_userId: { messageId, userId } },
      })
      likedByUser = !!like
    }

    return NextResponse.json({ count, likedByUser })
  } catch (error) {
    console.error('GET /api/messages/likes error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
