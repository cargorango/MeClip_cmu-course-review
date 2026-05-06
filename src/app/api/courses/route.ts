import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchCourses } from '@/lib/course-search'
import { filterByCurriculum } from '@/lib/course-filter'
import { calculateAverageRating } from '@/lib/rating'

// Force dynamic so Next.js doesn't try to statically render this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const curriculumId = searchParams.get('curriculum') ?? ''
    const year = searchParams.get('year') ?? ''

    // Use aggregation to avoid fetching all rating rows
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        nameTh: true,
        facultyId: true,
        curriculumId: true,
        curriculum: {
          select: { id: true, programType: true, curriculumYear: true },
        },
        _count: { select: { ratings: true } },
        ratings: { select: { rating: true } },
      },
    })

    let result = courses.map(course => ({
      id: course.id,
      code: course.code,
      name: course.name,
      nameTh: course.nameTh,
      facultyId: course.facultyId,
      curriculumId: course.curriculumId,
      programType: course.curriculum.programType,
      curriculumYear: course.curriculum.curriculumYear,
      averageRating: calculateAverageRating(course.ratings.map(r => r.rating)),
      totalRatings: course._count.ratings,
    }))

    if (curriculumId) {
      result = filterByCurriculum(result, curriculumId)
    }

    if (year) {
      const yearNum = parseInt(year)
      if (!isNaN(yearNum)) {
        result = result.filter(c => c.curriculumYear === yearNum)
      }
    }

    if (q) {
      result = searchCourses(result, q)
    }

    return NextResponse.json(
      { courses: result },
      {
        headers: {
          // Cache for 30s on CDN, stale-while-revalidate 60s
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('GET /api/courses error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
