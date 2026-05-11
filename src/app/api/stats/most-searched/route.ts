import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTopCoursesByLogCount, CourseWithLogCount } from '@/lib/course-ranking'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Query CourseViewLog counts grouped by courseId
    const viewCounts = await prisma.courseViewLog.groupBy({
      by: ['courseId'],
      _count: { courseId: true },
    })

    // Query CourseSearchLog counts grouped by courseId (only where courseId is set)
    const searchCounts = await prisma.courseSearchLog.groupBy({
      by: ['courseId'],
      where: { courseId: { not: null } },
      _count: { courseId: true },
    })

    // Merge counts into a map
    const logCountMap = new Map<string, number>()

    for (const row of viewCounts) {
      logCountMap.set(row.courseId, (logCountMap.get(row.courseId) ?? 0) + row._count.courseId)
    }

    for (const row of searchCounts) {
      if (row.courseId) {
        logCountMap.set(row.courseId, (logCountMap.get(row.courseId) ?? 0) + row._count.courseId)
      }
    }

    if (logCountMap.size === 0) {
      return NextResponse.json({ courses: [] })
    }

    // Fetch course details for all courseIds that have logs
    const courseIds = Array.from(logCountMap.keys())
    const coursesRaw = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        code: true,
        name: true,
        nameTh: true,
        faculty: { select: { id: true, nameTh: true } },
      },
    })

    // Build CourseWithLogCount array
    const coursesWithLogCount: CourseWithLogCount[] = coursesRaw.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nameTh: c.nameTh,
      faculty: { nameTh: c.faculty.nameTh },
      logCount: logCountMap.get(c.id) ?? 0,
    }))

    const top10 = getTopCoursesByLogCount(coursesWithLogCount, 10)

    return NextResponse.json({ courses: top10 })
  } catch (error) {
    console.error('GET /api/stats/most-searched error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
