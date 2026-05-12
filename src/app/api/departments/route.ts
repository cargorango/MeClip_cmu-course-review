import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all distinct department values from courses (both regular and free elective)
    const rows = await prisma.course.findMany({
      select: { department: true },
      where: { department: { not: '' } },
      distinct: ['department'],
    })

    const hasFreeElective = await prisma.course.count({ where: { isFreeElective: true } })

    // Collect all unique department names, filter out placeholder values
    const deptSet = new Set<string>()
    for (const row of rows) {
      const dept = (row.department ?? '').trim()
      if (dept && dept !== 'นำเข้าจาก CSV' && dept !== '-') {
        deptSet.add(dept)
      }
    }

    const departments = Array.from(deptSet).sort((a, b) => a.localeCompare(b, 'en'))

    return NextResponse.json({
      departments,
      hasFreeElective: hasFreeElective > 0,
    })
  } catch (error) {
    console.error('GET /api/departments error:', error)
    return NextResponse.json({ departments: [], hasFreeElective: false })
  }
}
