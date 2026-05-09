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

// Parse CSV text — handles quoted fields with commas inside
function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  return lines.map(line => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if ((ch === ',' || ch === '\t') && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  })
}

// Column name → index mapping
const COLUMN_MAP: Record<string, string> = {
  'รหัสวิชา': 'code',
  'รหัสย่อ (EN)': 'codeEn',
  'รหัสย่อ (TH)': 'codeTh',
  'ชื่อวิชา (อังกฤษ)': 'name',
  'ชื่อวิชา (ไทย)': 'nameTh',
  'หน่วยกิต (เต็ม)': 'credits',
  'คำอธิบายวิชา (ไทย)': 'description',
  'คำอธิบายวิชา (อังกฤษ)': 'descriptionEn',
  'Prerequisite': 'prerequisite',
  'คณะ/หน่วยงาน': 'department',
  'วันที่อัปเดต': 'updatedDate',
  // Excluded: ปีการศึกษา, ภาคการศึกษา
}

export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์ CSV' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ .csv เท่านั้น' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text).filter(r => r.some(c => c.length > 0))

    if (rows.length < 2) {
      return NextResponse.json({ error: 'ไฟล์ CSV ต้องมีข้อมูลอย่างน้อย 1 แถว (ไม่นับ header)' }, { status: 400 })
    }

    // Build column index map from header row
    const headers = rows[0]
    const colIndex: Record<string, number> = {}
    headers.forEach((h, i) => {
      const key = COLUMN_MAP[h.trim()]
      if (key) colIndex[key] = i
    })

    if (colIndex['code'] === undefined) {
      return NextResponse.json({ error: 'ไม่พบคอลัมน์ "รหัสวิชา" ใน header ของไฟล์' }, { status: 400 })
    }

    const getVal = (row: string[], key: string): string => {
      const idx = colIndex[key]
      if (idx === undefined) return ''
      const val = (row[idx] ?? '').trim()
      return val === '' ? '-' : val
    }

    // Upsert default faculty/curriculum for CSV imports
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
      create: { id: defaultCurriculumId, facultyId: defaultFacultyId, programType: 'REGULAR', curriculumYear: 2024 },
    })

    let inserted = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    const dataRows = rows.slice(1)

    for (const row of dataRows) {
      const code = (row[colIndex['code']] ?? '').trim()
      if (!code) { skipped++; continue }

      const nameTh = getVal(row, 'nameTh')
      const name = getVal(row, 'name')

      if (nameTh === '-' && name === '-') { skipped++; continue }

      try {
        const existing = await prisma.course.findUnique({ where: { code } })

        const data = {
          name: name === '-' ? (existing?.name ?? '-') : name,
          nameTh: nameTh === '-' ? (existing?.nameTh ?? '-') : nameTh,
          codeEn: getVal(row, 'codeEn'),
          codeTh: getVal(row, 'codeTh'),
          credits: getVal(row, 'credits'),
          description: getVal(row, 'description'),
          descriptionEn: getVal(row, 'descriptionEn'),
          prerequisite: getVal(row, 'prerequisite'),
          department: getVal(row, 'department'),
          updatedDate: getVal(row, 'updatedDate'),
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
        await prisma.courseAuditLog.create({
          data: {
            courseId: (await prisma.course.findUnique({ where: { code }, select: { id: true } }))!.id,
            adminId: session!.user.id,
            action: existing ? 'UPDATE' : 'CREATE',
          },
        })
      } catch (err) {
        errors.push(`รหัส ${code}: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }

    return NextResponse.json({
      message: `นำเข้าสำเร็จ: เพิ่มใหม่ ${inserted} วิชา, อัปเดต ${updated} วิชา, ข้าม ${skipped} แถว`,
      inserted,
      updated,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors only
    })
  } catch (err) {
    console.error('POST /api/admin/courses/import error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
