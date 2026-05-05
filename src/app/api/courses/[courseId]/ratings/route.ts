import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { calculateAverageRating } from '@/lib/rating'

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      )
    }

    const { courseId } = params
    const body = await request.json()
    const { rating } = body

    // Validate rating value
    if (![1, 2, 3].includes(rating)) {
      return NextResponse.json(
        { error: 'คะแนนความยากต้องเป็น 1, 2 หรือ 3' },
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

    // Upsert rating (one per user per course)
    await prisma.difficultyRating.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId: session.user.id,
        },
      },
      update: { rating },
      create: {
        courseId,
        userId: session.user.id,
        rating,
      },
    })

    // Fetch updated ratings
    const allRatings = await prisma.difficultyRating.findMany({
      where: { courseId },
      select: { rating: true },
    })

    const ratings = allRatings.map(r => r.rating)
    const ratingDistribution = {
      one: ratings.filter(r => r === 1).length,
      two: ratings.filter(r => r === 2).length,
      three: ratings.filter(r => r === 3).length,
    }

    return NextResponse.json({
      averageRating: calculateAverageRating(ratings),
      totalRatings: ratings.length,
      ratingDistribution,
    })
  } catch (error) {
    console.error('POST /api/courses/[courseId]/ratings error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
