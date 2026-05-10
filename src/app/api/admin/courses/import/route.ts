import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
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

export interface CourseRow {
  code: string
  name?: string
  nameTh?: string
  codeEn?: string
  codeTh?: string
  credits?: string
  description?: string
  descriptionEn?: string
  prerequisite?: string
  department?: string
  updatedDate?: string
}

function clean(v: string | undefined): string {
  const s = (v ?? '').trim()
  return s === '' ? '-' : s
}

// POST /api/admin/courses/import
// Body: { courses: CourseRow[] }  — JSON micro-batch (max 50 rows) from client
// Uses Prisma upsert to prevent duplicates on repeated uploads
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json() as { courses?: CourseRow[] }

    if (!body.courses || !Array.isArray(body.courses) || body.courses.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลวิชาในคำขอ' }, { status: 400 })
    }

    const rows = body.courses

    // Ensure default faculty/curriculum exist (idempotent)
    const defaultFacultyId = 'faculty-csv-import'
    const defaultCurriculumId = 'curriculum-csv-import'

    await prisma.faculty.upsert({
      where: { id: defaultFacultyId },
      update: {},
      create: { id: defaultFacultyId, name: 'CSV Import', nameTh: 'นำเข้าจาก CSV' },
    })
    await prisma.curriculum.upsert({
      where: { id: defaultCurriculumId },
      update: {},
      create: {
        id: defaultCurriculumId,
        facultyId: defaultFacultyId,
        programType: 'REGULAR',
        curriculumYear: 2024,
      },
    })

    // Filter valid rows (must have a course code)
    const validRows = rows.filter(r => (r.code ?? '').trim() !== '')
    const skipped = rows.length - validRows.length

    if (validRows.length === 0) {
      return NextResponse.json({ message: 'ไม่มีข้อมูลที่ถูกต้อง', inserted: 0, updated: 0, skipped, errors: [] })
    }

    const codes = validRows.map(r => r.code.trim())

    // Bulk fetch existing courses in ONE query to determine insert vs update
    const existingCourses = await prisma.course.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true, name: true, nameTh: true },
    })
    const existingMap = new Map(existingCourses.map(c => [c.code, c]))

    let inserted = 0
    let updated = 0
    const errors: string[] = []
    const auditLogs: { courseId: string; adminId: string; action: string }[] = []

    for (const row of validRows) {
      const code = row.code.trim()
      const existing = existingMap.get(code)

      const nameTh = clean(row.nameTh)
      const name = clean(row.name)

      // Skip rows with no name for brand-new courses
      if (nameTh === '-' && name === '-' && !existing) {
        continue
      }

      const courseData = {
        name: name === '-' ? (existing?.name ?? '-') : name,
        nameTh: nameTh === '-' ? (existing?.nameTh ?? '-') : nameTh,
        codeEn: clean(row.codeEn),
        codeTh: clean(row.codeTh),
        credits: clean(row.credits),
        description: clean(row.description),
        descriptionEn: clean(row.descriptionEn),
        prerequisite: clean(row.prerequisite),
        department: clean(row.department),
        updatedDate: clean(row.updatedDate),
      }

      try {
        // Upsert: create if not exists, update if exists — atomic and idempotent
        const result = await prisma.course.upsert({
          where: { code },
          update: courseData,
          create: {
            ...courseData,
            code,
            isFreeElective: false,
            facultyId: defaultFacultyId,
            curriculumId: defaultCurriculumId,
          },
          select: { id: true },
        })

        if (existing) {
          auditLogs.push({ courseId: result.id, adminId: session!.user.id, action: 'UPDATE' })
          updated++
        } else {
          auditLogs.push({ courseId: result.id, adminId: session!.user.id, action: 'CREATE' })
          inserted++
        }
      } catch (err) {
        errors.push(`รหัส ${code}: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }

    // Bulk insert audit logs in one query
    if (auditLogs.length > 0) {
      await prisma.courseAuditLog.createMany({ data: auditLogs })
    }

    return NextResponse.json({
      message: `เพิ่มใหม่ ${inserted} วิชา, อัปเดต ${updated} วิชา, ข้าม ${skipped} แถว`,
      inserted,
      updated,
      skipped,
      errors: errors.slice(0, 10),
    })
  } catch (err) {
    console.error('POST /api/admin/courses/import error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
