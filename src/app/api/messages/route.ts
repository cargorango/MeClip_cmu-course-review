import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'
import { calculateReviewerLevel } from '@/lib/reviewer-level'
import { containsProfanity } from '@/lib/profanity'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), PAGE_SIZE)

    if (!courseId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ courseId' },
        { status: 400 }
      )
    }

    // Find the review room for this course
    const reviewRoom = await prisma.reviewRoom.findUnique({
      where: { courseId },
    })

    if (!reviewRoom) {
      return NextResponse.json({ messages: [], nextCursor: null })
    }

    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      where: {
        roomId: reviewRoom.id,
        isDeleted: false,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to determine if there's a next page
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            isAnonymous: true,
            ratings: { select: { courseId: true } },
          },
        },
      },
    })

    const hasMore = messages.length > limit
    const pageMessages = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? pageMessages[pageMessages.length - 1].id : null

    const formattedMessages = pageMessages.map(msg => {
      const uniqueCoursesReviewed = new Set(msg.user.ratings.map(r => r.courseId)).size
      const reviewerLevel = calculateReviewerLevel(uniqueCoursesReviewed)

      return {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        sender: {
          displayName: msg.user.isAnonymous ? 'ไม่ระบุตัวตน' : msg.user.displayName,
          reviewerLevel: msg.user.isAnonymous ? null : reviewerLevel,
        },
      }
    })

    return NextResponse.json({
      messages: formattedMessages,
      nextCursor,
    })
  } catch (error) {
    console.error('GET /api/messages error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, content } = body

    // Validate content
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อความ' },
        { status: 400 }
      )
    }

    // Check profanity
    if (containsProfanity(content)) {
      return NextResponse.json(
        { error: 'ข้อความมีคำที่ไม่เหมาะสม กรุณาแก้ไขและส่งใหม่' },
        { status: 400 }
      )
    }

    // Check course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })
    if (!course) {
      return NextResponse.json(
        { error: 'ไม่พบกระบวนวิชา' },
        { status: 404 }
      )
    }

    // Get or create review room (one per course)
    const reviewRoom = await prisma.reviewRoom.upsert({
      where: { courseId },
      update: {},
      create: { courseId },
    })

    // Create message
    const message = await prisma.message.create({
      data: {
        roomId: reviewRoom.id,
        userId: session.user.id,
        content: content.trim(),
      },
    })

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('POST /api/messages error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
