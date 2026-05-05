import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'กรุณาเข้าสู่ระบบก่อน', status: 401 }
  }
  if (session.user.role !== 'SUPER_ADMIN') {
    return { error: 'เฉพาะ Super Admin เท่านั้น', status: 403 }
  }
  return { error: null, status: 200 }
}

// GET: list all faculties with curricula and course counts
export async function GET() {
  const { error, status } = await requireSuperAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        curricula: {
          include: {
            _count: { select: { courses: true } },
          },
        },
        _count: { select: { courses: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ faculties })
  } catch (error) {
    console.error('GET /api/admin/faculties error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

// POST: create faculty, curriculum, or course
export async function POST(request: NextRequest) {
  const { error, status } = await requireSuperAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { type } = body

    if (type === 'faculty') {
      const { name, nameTh } = body
      if (!name || !nameTh) {
        return NextResponse.json({ error: 'กรุณากรอกชื่อคณะ' }, { status: 400 })
      }
      const faculty = await prisma.faculty.create({
        data: { name: name.trim(), nameTh: nameTh.trim() },
      })
      return NextResponse.json({ faculty })
    }

    if (type === 'curriculum') {
      const { facultyId, programType, curriculumYear } = body
      if (!facultyId || !programType || !curriculumYear) {
        return NextResponse.json({ error: 'ข้อมูลหลักสูตรไม่ครบถ้วน' }, { status: 400 })
      }
      if (!['REGULAR', 'INTERNATIONAL'].includes(programType)) {
        return NextResponse.json({ error: 'ประเภทหลักสูตรไม่ถูกต้อง' }, { status: 400 })
      }
      const curriculum = await prisma.curriculum.create({
        data: {
          facultyId,
          programType,
          curriculumYear: parseInt(curriculumYear),
        },
      })
      return NextResponse.json({ curriculum })
    }

    if (type === 'course') {
      const { code, name, nameTh, facultyId, curriculumId } = body
      if (!code || !name || !nameTh || !facultyId || !curriculumId) {
        return NextResponse.json({ error: 'ข้อมูลวิชาไม่ครบถ้วน' }, { status: 400 })
      }
      const course = await prisma.course.create({
        data: {
          code: code.trim(),
          name: name.trim(),
          nameTh: nameTh.trim(),
          facultyId,
          curriculumId,
        },
      })
      return NextResponse.json({ course })
    }

    return NextResponse.json({ error: 'ประเภทข้อมูลไม่ถูกต้อง' }, { status: 400 })
  } catch (error: unknown) {
    console.error('POST /api/admin/faculties error:', error)
    // Handle unique constraint violation for course code
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'รหัสวิชานี้มีอยู่แล้วในระบบ' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

// DELETE: delete faculty or course
export async function DELETE(request: NextRequest) {
  const { error, status } = await requireSuperAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')
    const courseId = searchParams.get('courseId')

    if (courseId) {
      await prisma.course.delete({ where: { id: courseId } })
      return NextResponse.json({ message: 'ลบวิชาเรียบร้อย' })
    }

    if (facultyId) {
      await prisma.faculty.delete({ where: { id: facultyId } })
      return NextResponse.json({ message: 'ลบคณะเรียบร้อย' })
    }

    return NextResponse.json({ error: 'กรุณาระบุ facultyId หรือ courseId' }, { status: 400 })
  } catch (error) {
    console.error('DELETE /api/admin/faculties error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
