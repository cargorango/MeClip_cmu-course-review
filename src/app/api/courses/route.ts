import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchCourses } from '@/lib/course-search'
import { filterByCurriculum } from '@/lib/course-filter'
import { calculateAverageRating } from '@/lib/rating'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const curriculumId = searchParams.get('curriculum') ?? ''
    const year = searchParams.get('year') ?? ''

    // Fetch all courses with rating counts
    const courses = await prisma.course.findMany({
      include: {
        ratings: { select: { rating: true } },
        faculty: { select: { id: true, name: true, nameTh: true } },
        curriculum: {
          select: { id: true, programType: true, curriculumYear: true },
        },
      },
    })

    // Map to response shape
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
      totalRatings: course.ratings.length,
    }))

    // Filter by curriculum
    if (curriculumId) {
      result = filterByCurriculum(result, curriculumId)
    }

    // Filter by year
    if (year) {
      const yearNum = parseInt(year)
      if (!isNaN(yearNum)) {
        result = result.filter(c => c.curriculumYear === yearNum)
      }
    }

    // Search by query
    if (q) {
      result = searchCourses(result, q)
    }

    return NextResponse.json({ courses: result })
  } catch (error) {
    console.error('GET /api/courses error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
