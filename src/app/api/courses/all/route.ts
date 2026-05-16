import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAverageRating } from '@/lib/rating'
import { filterByFacultyAndCredits } from '@/lib/course-filter-v2'
import { sortByReviews, sortByGrade, sortByCode } from '@/lib/course-sort'
import { GRADE_VALUES, type GradeValue } from '@/lib/grade-stats'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const dept = searchParams.get('dept') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 50
    const skip = (page - 1) * limit

    // New filter params
    const facultyId = searchParams.get('facultyId') ?? ''
    const credits = searchParams.get('credits') ?? ''
    const sort = searchParams.get('sort') ?? ''
    const grade = searchParams.get('grade') ?? ''
    const isFreeElectiveParam = searchParams.get('isFreeElective')
    const isFreeElective = isFreeElectiveParam === 'true'

    if (!q && !dept && !facultyId && !credits && !isFreeElective && !grade && !sort) {
      return NextResponse.json({ courses: [], total: 0, page: 1, totalPages: 0 })
    }

    const conditions: object[] = []
    if (q) {
      const isNumeric = /^\d+$/.test(q)
      if (isNumeric) {
        conditions.push({
          OR: [
            { code: { startsWith: q, mode: 'insensitive' as const } },
            { codeEn: { startsWith: q, mode: 'insensitive' as const } },
            { codeTh: { startsWith: q, mode: 'insensitive' as const } },
          ],
        })
      } else {
        conditions.push({
          OR: [
            { code: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { nameTh: { contains: q, mode: 'insensitive' as const } },
            { codeEn: { contains: q, mode: 'insensitive' as const } },
            { codeTh: { contains: q, mode: 'insensitive' as const } },
          ],
        })
      }
    }
    if (dept) {
      conditions.push({ department: { contains: dept, mode: 'insensitive' as const } })
    }
    if (isFreeElective) {
      conditions.push({ isFreeElective: true })
    }
    // Credits filter at DB level using startsWith
    if (credits) {
      conditions.push({ credits: { startsWith: credits } })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          nameTh: true,
          codeEn: true,
          credits: true,
          department: true,
          updatedDate: true,
          facultyId: true,
          isFreeElective: true,
          faculty: { select: { id: true, nameTh: true } },
          _count: { select: { ratings: true } },
          ratings: { select: { rating: true } },
          reviewRoom: { select: { _count: { select: { messages: true } } } },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    const enriched = courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nameTh: c.nameTh,
      codeEn: c.codeEn,
      credits: c.credits,
      department: c.department,
      updatedDate: c.updatedDate,
      facultyId: c.facultyId,
      isFreeElective: c.isFreeElective,
      faculty: c.faculty,
      averageRating: calculateAverageRating(c.ratings.map((r) => r.rating)),
      totalRatings: c._count.ratings,
      reviewCount: c.reviewRoom?._count.messages ?? 0,
    }))

    // Apply faculty and credits filters (pure logic — credits already filtered at DB level)
    const filtered = filterByFacultyAndCredits(enriched, facultyId, '')

    // Apply sort
    let sorted: typeof filtered
    if (sort === 'reviews') {
      sorted = sortByReviews(filtered)
    } else if (grade && (GRADE_VALUES as readonly string[]).includes(grade)) {
      sorted = sortByGrade(filtered, grade as GradeValue)
    } else if (sort && (GRADE_VALUES as readonly string[]).includes(sort)) {
      sorted = sortByGrade(filtered, sort as GradeValue)
    } else {
      sorted = sortByCode(filtered)
    }

    return NextResponse.json({
      courses: sorted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/courses/all error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
