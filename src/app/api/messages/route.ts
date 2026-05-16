import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'
import { calculateReviewerLevel } from '@/lib/reviewer-level'
import { containsProfanity } from '@/lib/profanity'
import { formatStatus } from '@/lib/status-formatter'
import { GRADE_VALUES } from '@/lib/grade-stats'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

function getSenderLabel(msg: {
  wasAnonymous: boolean | null
  senderStatus: string | null
  senderYearOfStudy: number | null
  senderDegreeLevel: string | null
  senderFaculty: string | null
  senderAlumniYear: number | null
  user: { isAnonymous: boolean; displayName: string; ratings: { courseId: string }[] }
}): { displayName: string; reviewerLevel: string | null; statusLabel: string | null } {
  const isAnon = msg.wasAnonymous ?? msg.user.isAnonymous

  const statusLabel = msg.senderStatus
    ? formatStatus({
        status: msg.senderStatus,
        degreeLevel: msg.senderDegreeLevel,
        yearOfStudy: msg.senderYearOfStudy,
        faculty: msg.senderFaculty,
        alumniYear: msg.senderAlumniYear,
      })
    : null

  if (isAnon) {
    return { displayName: statusLabel ?? 'ไม่ระบุตัวตน', reviewerLevel: null, statusLabel: null }
  }

  const uniqueCoursesReviewed = new Set(msg.user.ratings.map(r => r.courseId)).size
  const reviewerLevel = calculateReviewerLevel(uniqueCoursesReviewed)
  return { displayName: msg.user.displayName, reviewerLevel, statusLabel }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), PAGE_SIZE)

    if (!courseId) {
      return NextResponse.json({ error: 'กรุณาระบุ courseId' }, { status: 400 })
    }

    const session = await auth()
    const currentUserId = session?.user?.id ?? null

    const reviewRoom = await prisma.reviewRoom.findUnique({ where: { courseId } })
    if (!reviewRoom) {
      return NextResponse.json({ messages: [], nextCursor: null })
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId: reviewRoom.id,
        isDeleted: false,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            isAnonymous: true,
            ratings: { select: { courseId: true } },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    const hasMore = messages.length > limit
    const pageMessages = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? pageMessages[pageMessages.length - 1].id : null

    // Fetch likes for current user if logged in
    let userLikes = new Set<string>()
    if (currentUserId) {
      const likes = await prisma.messageLike.findMany({
        where: {
          userId: currentUserId,
          messageId: { in: pageMessages.map((m) => m.id) },
        },
        select: { messageId: true },
      })
      userLikes = new Set(likes.map((l) => l.messageId))
    }

    const formattedMessages = pageMessages.map(msg => {
      const { displayName, reviewerLevel, statusLabel } = getSenderLabel({
        wasAnonymous: msg.wasAnonymous,
        senderStatus: msg.senderStatus,
        senderYearOfStudy: msg.senderYearOfStudy,
        senderDegreeLevel: msg.senderDegreeLevel,
        senderFaculty: msg.senderFaculty,
        senderAlumniYear: msg.senderAlumniYear,
        user: msg.user,
      })

      return {
        id: msg.id,
        content: msg.content,
        grade: msg.grade,
        createdAt: msg.createdAt.toISOString(),
        editedAt: msg.editedAt?.toISOString() ?? null,
        isOwn: msg.user.id === currentUserId,
        likeCount: msg._count.likes,
        likedByUser: userLikes.has(msg.id),
        sender: {
          displayName,
          reviewerLevel,
          statusLabel,
        },
      }
    })

    return NextResponse.json({ messages: formattedMessages, nextCursor })
  } catch (error) {
    console.error('GET /api/messages error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, content, isAnonymous, grade } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกข้อความ' }, { status: 400 })
    }

    if (containsProfanity(content)) {
      return NextResponse.json({ error: 'ข้อความมีคำที่ไม่เหมาะสม กรุณาแก้ไขและส่งใหม่' }, { status: 400 })
    }

    // Validate grade if provided
    if (grade !== undefined && grade !== null && !(GRADE_VALUES as readonly string[]).includes(grade)) {
      return NextResponse.json({ error: 'เกรดไม่ถูกต้อง' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'ไม่พบกระบวนวิชา' }, { status: 404 })
    }

    // Get sender's current profile for snapshot (including new fields)
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isAnonymous: true,
        status: true,
        yearOfStudy: true,
        degreeLevel: true,
        faculty: true,
        alumniYear: true,
      },
    })

    // Use isAnonymous from request body (snapshot at send time)
    const wasAnonymous = typeof isAnonymous === 'boolean' ? isAnonymous : (sender?.isAnonymous ?? false)

    const reviewRoom = await prisma.reviewRoom.upsert({
      where: { courseId },
      update: {},
      create: { courseId },
    })

    const message = await prisma.message.create({
      data: {
        roomId: reviewRoom.id,
        userId: session.user.id,
        content: content.trim(),
        grade: grade ?? null,
        // Snapshot at send time — locked forever
        wasAnonymous,
        senderStatus: sender?.status ?? null,
        senderYearOfStudy: sender?.yearOfStudy ?? null,
        senderDegreeLevel: sender?.degreeLevel ?? null,
        senderFaculty: sender?.faculty ?? null,
        senderAlumniYear: sender?.alumniYear ?? null,
      },
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('POST /api/messages error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, content } = body

    if (!messageId) {
      return NextResponse.json({ error: 'กรุณาระบุ messageId' }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกข้อความ' }, { status: 400 })
    }

    if (containsProfanity(content)) {
      return NextResponse.json({ error: 'ข้อความมีคำที่ไม่เหมาะสม กรุณาแก้ไขและส่งใหม่' }, { status: 400 })
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, userId: true, createdAt: true, isDeleted: true },
    })

    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'ไม่พบข้อความ' }, { status: 404 })
    }

    if (message.userId !== session.user.id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขข้อความนี้' }, { status: 403 })
    }

    const hoursSinceCreated = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreated > 24) {
      return NextResponse.json({ error: 'ไม่สามารถแก้ไขข้อความที่เกิน 24 ชั่วโมงได้' }, { status: 403 })
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: updated.id,
      content: updated.content,
      editedAt: updated.editedAt?.toISOString() ?? null,
    })
  } catch (error) {
    console.error('PATCH /api/messages error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
