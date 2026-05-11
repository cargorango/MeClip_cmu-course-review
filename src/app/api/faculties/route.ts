import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const faculties = await prisma.faculty.findMany({
      select: { id: true, nameTh: true },
      where: {
        nameTh: { not: 'นำเข้าจาก CSV' },
        courses: { some: {} }, // only faculties that have at least 1 course
      },
      orderBy: { nameTh: 'asc' },
    })
    return NextResponse.json({ faculties })
  } catch (error) {
    console.error('GET /api/faculties error:', error)
    return NextResponse.json({ faculties: [] })
  }
}
