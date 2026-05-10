import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAverageRating } from '@/lib/rating'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        name: true,
        nameTh: true,
        facultyId: true,
        curriculumId: true,
        ratings: { select: { rating: true } },
        faculty: { select: { id: true, name: true, nameTh: true } },
        curriculum: { select: { id: true, programType: true, curriculumYear: true } },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'ไม่พบกระบวนวิชา' },
        { status: 404 }
      )
    }

    const ratings = course.ratings.map(r => r.rating)
    const ratingDistribution = {
      one: ratings.filter(r => r === 1).length,
      two: ratings.filter(r => r === 2).length,
      three: ratings.filter(r => r === 3).length,
    }

    return NextResponse.json({
      id: course.id,
      code: course.code,
      name: course.name,
      nameTh: course.nameTh,
      facultyId: course.facultyId,
      curriculumId: course.curriculumId,
      programType: course.curriculum.programType,
      curriculumYear: course.curriculum.curriculumYear,
      averageRating: calculateAverageRating(ratings),
      totalRatings: ratings.length,
      ratingDistribution,
    })
  } catch (error) {
    console.error('GET /api/courses/[courseId] error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
