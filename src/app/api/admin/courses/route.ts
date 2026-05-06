import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'กรุณาเข้าสู่ระบบก่อน', status: 401 }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return { error: 'ไม่มีสิทธิ์เข้าถึง', status: 403 }
  }
  return { error: null, status: 200 }
}

export async function POST(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { code, name, nameTh, credits, description } = body

    if (!code?.trim() || !name?.trim() || !nameTh?.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสวิชา ชื่อวิชาภาษาอังกฤษ และชื่อวิชาภาษาไทย' },
        { status: 400 }
      )
    }

    // Check duplicate code
    const existing = await prisma.course.findUnique({ where: { code: code.trim() } })
    if (existing) {
      return NextResponse.json(
        { error: `รหัสวิชา ${code.trim()} มีอยู่ในระบบแล้ว` },
        { status: 409 }
      )
    }

    // Upsert free-elective faculty/curriculum
    const faculty = await prisma.faculty.upsert({
      where: { id: 'faculty-free-elective' },
      update: {},
      create: {
        id: 'faculty-free-elective',
        name: 'Free Elective Courses',
        nameTh: 'วิชาเลือกเสรี',
      },
    })

    const curriculum = await prisma.curriculum.upsert({
      where: { id: 'curriculum-free-elective' },
      update: {},
      create: {
        id: 'curriculum-free-elective',
        facultyId: faculty.id,
        programType: 'REGULAR',
        curriculumYear: 2024,
      },
    })

    const course = await prisma.course.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        nameTh: nameTh.trim(),
        credits: credits?.trim() ?? '',
        description: description?.trim() ?? '',
        isFreeElective: true,
        facultyId: faculty.id,
        curriculumId: curriculum.id,
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/courses error:', err)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
