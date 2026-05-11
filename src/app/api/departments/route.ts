import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all distinct department values from courses
    const rows = await prisma.course.findMany({
      select: { department: true, isFreeElective: true },
      where: { department: { not: '' } },
      distinct: ['department'],
    })

    const hasFreeElective = await prisma.course.count({ where: { isFreeElective: true } })

    // Strip "Faculty of " prefix, deduplicate, sort A-Z
    const deptSet = new Set<string>()
    for (const row of rows) {
      if (!row.isFreeElective && row.department) {
        const cleaned = row.department.replace(/^Faculty of\s+/i, '').trim()
        if (cleaned && cleaned !== 'นำเข้าจาก CSV') {
          deptSet.add(cleaned)
        }
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
