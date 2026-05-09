import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAverageRating } from '@/lib/rating'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const dept = searchParams.get('dept') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 50
    const skip = (page - 1) * limit

    if (!q && !dept) {
      return NextResponse.json({ courses: [], total: 0, page: 1, totalPages: 0 })
    }

    const conditions = []
    if (q) {
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
    if (dept) {
      conditions.push({ department: { contains: dept, mode: 'insensitive' as const } })
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
          ratings: { select: { rating: true } },
          _count: { select: { ratings: true } },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    return NextResponse.json({
      courses: courses.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        nameTh: c.nameTh,
        codeEn: c.codeEn,
        credits: c.credits,
        department: c.department,
        updatedDate: c.updatedDate,
        averageRating: calculateAverageRating(c.ratings.map(r => r.rating)),
        totalRatings: c._count.ratings,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/courses/all error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
