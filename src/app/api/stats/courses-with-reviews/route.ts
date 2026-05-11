import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCoursesWithReviews, CoursesWithReviewsItem } from '@/lib/course-ranking'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isFreeElective: false },
      select: {
        id: true,
        code: true,
        name: true,
        nameTh: true,
        isFreeElective: true,
        faculty: { select: { id: true, nameTh: true } },
        reviewRoom: {
          select: {
            _count: {
              select: {
                messages: { where: { isDeleted: false } },
              },
            },
          },
        },
      },
    })

    const coursesWithReviews: CoursesWithReviewsItem[] = courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nameTh: c.nameTh,
      isFreeElective: c.isFreeElective,
      faculty: { nameTh: c.faculty.nameTh },
      reviewCount: c.reviewRoom?._count.messages ?? 0,
    }))

    const filtered = getCoursesWithReviews(coursesWithReviews)
    const top10 = filtered.slice(0, 10)

    return NextResponse.json({ courses: top10 })
  } catch (error) {
    console.error('GET /api/stats/courses-with-reviews error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
