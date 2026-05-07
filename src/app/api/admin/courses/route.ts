import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER']

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'กรุณาเข้าสู่ระบบก่อน', status: 401, session: null }
  if (!ADMIN_ROLES.includes(session.user.role)) {
    return { error: 'ไม่มีสิทธิ์เข้าถึง', status: 403, session: null }
  }
  return { error: null, status: 200, session }
}

export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const includeAudit = searchParams.get('audit') === 'true'
    const q = searchParams.get('q') ?? ''

    const where = q ? {
      OR: [
        { code: { contains: q, mode: 'insensitive' as const } },
        { name: { contains: q, mode: 'insensitive' as const } },
        { nameTh: { contains: q, mode: 'insensitive' as const } },
      ]
    } : {}

    const [courses, auditLogs] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          faculty: { select: { id: true, name: true, nameTh: true } },
          curriculum: { select: { id: true, programType: true, curriculumYear: true } },
          _count: { select: { ratings: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: q ? 100 : 50,
      }),
      includeAudit
        ? prisma.courseAuditLog.findMany({
            include: {
              course: { select: { id: true, code: true, nameTh: true } },
              admin: { select: { id: true, displayName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      courses: courses.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        nameTh: c.nameTh,
        credits: c.credits,
        description: c.description,
        isFreeElective: c.isFreeElective,
        faculty: c.faculty,
        curriculum: c.curriculum,
        reviewCount: c._count.ratings,
        createdAt: c.createdAt.toISOString(),
      })),
      auditLogs: auditLogs.map(l => ({
        id: l.id,
        action: l.action,
        createdAt: l.createdAt.toISOString(),
        course: l.course,
        admin: l.admin,
      })),
    })
  } catch (err) {
    console.error('GET /api/admin/courses error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { code, name, nameTh, credits, description, isFreeElective } = body

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

    const isElective = isFreeElective === true || isFreeElective === 'true'

    // Upsert faculty/curriculum based on isFreeElective
    const facultyId = isElective ? 'faculty-free-elective' : 'faculty-general'
    const curriculumId = isElective ? 'curriculum-free-elective' : 'curriculum-general'

    const faculty = await prisma.faculty.upsert({
      where: { id: facultyId },
      update: {},
      create: {
        id: facultyId,
        name: isElective ? 'Free Elective Courses' : 'General Courses',
        nameTh: isElective ? 'วิชาเลือกเสรี' : 'วิชาทั่วไป',
      },
    })

    const curriculum = await prisma.curriculum.upsert({
      where: { id: curriculumId },
      update: {},
      create: {
        id: curriculumId,
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
        isFreeElective: isElective,
        facultyId: faculty.id,
        curriculumId: curriculum.id,
      },
    })

    // Record audit log
    await prisma.courseAuditLog.create({
      data: {
        courseId: course.id,
        adminId: session!.user.id,
        action: 'CREATE',
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/courses error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { courseId, code, name, nameTh, credits, description, isFreeElective } = body

    if (!courseId) {
      return NextResponse.json({ error: 'กรุณาระบุ courseId' }, { status: 400 })
    }

    const existing = await prisma.course.findUnique({ where: { id: courseId } })
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบกระบวนวิชา' }, { status: 404 })
    }

    // Check code conflict (if changing code)
    if (code && code.trim() !== existing.code) {
      const codeConflict = await prisma.course.findUnique({ where: { code: code.trim() } })
      if (codeConflict) {
        return NextResponse.json({ error: `รหัสวิชา ${code.trim()} มีอยู่ในระบบแล้ว` }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (code !== undefined) updateData.code = code.trim()
    if (name !== undefined) updateData.name = name.trim()
    if (nameTh !== undefined) updateData.nameTh = nameTh.trim()
    if (credits !== undefined) updateData.credits = credits.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (isFreeElective !== undefined) updateData.isFreeElective = Boolean(isFreeElective)

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    })

    // Record audit log
    await prisma.courseAuditLog.create({
      data: {
        courseId: updated.id,
        adminId: session!.user.id,
        action: 'UPDATE',
      },
    })

    return NextResponse.json({ course: updated })
  } catch (err) {
    console.error('PATCH /api/admin/courses error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'กรุณาระบุ courseId' }, { status: 400 })
    }

    const existing = await prisma.course.findUnique({ where: { id: courseId } })
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบกระบวนวิชา' }, { status: 404 })
    }

    // Record audit log before deletion
    await prisma.courseAuditLog.create({
      data: {
        courseId: existing.id,
        adminId: session!.user.id,
        action: 'DELETE',
      },
    })

    // Delete related data first
    await prisma.$transaction([
      prisma.difficultyRating.deleteMany({ where: { courseId } }),
      prisma.message.deleteMany({
        where: { room: { courseId } },
      }),
      prisma.reviewRoom.deleteMany({ where: { courseId } }),
      prisma.course.delete({ where: { id: courseId } }),
    ])

    return NextResponse.json({ message: 'ลบกระบวนวิชาเรียบร้อย' })
  } catch (err) {
    console.error('DELETE /api/admin/courses error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
