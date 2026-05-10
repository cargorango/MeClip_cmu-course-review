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
  name: string
  nameTh: string
  codeEn: string
  codeTh: string
  credits: string
  description: string
  descriptionEn: string
  prerequisite: string
  department: string
  updatedDate: string
}

// POST /api/admin/courses/import
// Body: { courses: CourseRow[] }  — JSON batch sent from client after PapaParse
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

    let inserted = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of rows) {
      const code = (row.code ?? '').trim()
      if (!code) { skipped++; continue }

      const nameTh = (row.nameTh ?? '').trim() || '-'
      const name = (row.name ?? '').trim() || '-'

      if (nameTh === '-' && name === '-') { skipped++; continue }

      try {
        const existing = await prisma.course.findUnique({ where: { code } })

        const data = {
          name: name === '-' ? (existing?.name ?? '-') : name,
          nameTh: nameTh === '-' ? (existing?.nameTh ?? '-') : nameTh,
          codeEn: (row.codeEn ?? '').trim() || '-',
          codeTh: (row.codeTh ?? '').trim() || '-',
          credits: (row.credits ?? '').trim() || '-',
          description: (row.description ?? '').trim() || '-',
          descriptionEn: (row.descriptionEn ?? '').trim() || '-',
          prerequisite: (row.prerequisite ?? '').trim() || '-',
          department: (row.department ?? '').trim() || '-',
          updatedDate: (row.updatedDate ?? '').trim() || '-',
        }

        if (existing) {
          await prisma.course.update({ where: { code }, data })
          updated++
        } else {
          await prisma.course.create({
            data: {
              ...data,
              code,
              isFreeElective: false,
              facultyId: defaultFacultyId,
              curriculumId: defaultCurriculumId,
            },
          })
          inserted++
        }

        // Audit log
        const courseId = (await prisma.course.findUnique({ where: { code }, select: { id: true } }))!.id
        await prisma.courseAuditLog.create({
          data: {
            courseId,
            adminId: session!.user.id,
            action: existing ? 'UPDATE' : 'CREATE',
          },
        })
      } catch (err) {
        errors.push(`รหัส ${code}: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
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
