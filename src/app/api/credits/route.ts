import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all distinct credits values from courses
    const rows = await prisma.course.findMany({
      select: { credits: true },
      where: { credits: { not: '' } },
      distinct: ['credits'],
      orderBy: { credits: 'asc' },
    })

    // Extract numeric prefix for sorting (e.g. "3(3-0-6)" → 3)
    const credits = rows
      .map((r) => r.credits)
      .filter(Boolean)
      .sort((a, b) => {
        const numA = parseFloat(a)
        const numB = parseFloat(b)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return a.localeCompare(b)
      })

    return NextResponse.json({ credits })
  } catch (error) {
    console.error('GET /api/credits error:', error)
    return NextResponse.json({ credits: [] })
  }
}
