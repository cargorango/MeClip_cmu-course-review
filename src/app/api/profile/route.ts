import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'
import { validateDisplayName } from '@/lib/validation'
import { DegreeLevel, UserStatus } from '@prisma/client'

const VALID_DEGREE_LEVELS: DegreeLevel[] = ['BACHELOR', 'MASTER', 'DOCTORAL']

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        displayName: true,
        isAnonymous: true,
        email: true,
        role: true,
        status: true,
        yearOfStudy: true,
        degreeLevel: true,
        faculty: true,
        alumniYear: true,
        isProfileComplete: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName, isAnonymous, status, yearOfStudy, degreeLevel, faculty, alumniYear, isProfileComplete } = body

    // Validate display name
    if (displayName !== undefined) {
      if (!validateDisplayName(displayName)) {
        return NextResponse.json({ error: 'ชื่อต้องมีความยาว 1-50 ตัวอักษร' }, { status: 400 })
      }
    }

    // Validate status
    if (status !== undefined && status !== null) {
      const validStatuses: UserStatus[] = ['STUDENT', 'TEACHER', 'ALUMNI']
      if (!validStatuses.includes(status as UserStatus)) {
        return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 })
      }
    }

    // Validate yearOfStudy
    if (yearOfStudy !== undefined && yearOfStudy !== null) {
      const year = Number(yearOfStudy)
      if (!Number.isInteger(year) || year < 1 || year > 6) {
        return NextResponse.json({ error: 'ชั้นปีต้องอยู่ระหว่าง 1-6' }, { status: 400 })
      }
    }

    // Validate degreeLevel
    if (degreeLevel !== undefined && degreeLevel !== null) {
      if (!VALID_DEGREE_LEVELS.includes(degreeLevel as DegreeLevel)) {
        return NextResponse.json(
          { error: 'ระดับปริญญาไม่ถูกต้อง (ต้องเป็น BACHELOR, MASTER หรือ DOCTORAL)' },
          { status: 400 }
        )
      }
    }

    // Validate faculty
    if (faculty !== undefined && faculty !== null) {
      if (typeof faculty !== 'string' || faculty.trim().length === 0) {
        return NextResponse.json({ error: 'กรุณากรอกชื่อคณะ' }, { status: 400 })
      }
      if (faculty.trim().length > 100) {
        return NextResponse.json({ error: 'ชื่อคณะต้องมีความยาวไม่เกิน 100 ตัวอักษร' }, { status: 400 })
      }
    }

    // Validate alumniYear
    if (alumniYear !== undefined && alumniYear !== null) {
      const year = Number(alumniYear)
      if (!Number.isInteger(year) || year < 1 || year > 99) {
        return NextResponse.json({ error: 'รุ่นที่จบต้องเป็นตัวเลขระหว่าง 1-99' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (displayName !== undefined) updateData.displayName = displayName.trim()
    if (isAnonymous !== undefined) updateData.isAnonymous = Boolean(isAnonymous)
    if (isProfileComplete !== undefined) updateData.isProfileComplete = Boolean(isProfileComplete)

    // Handle status and null-out logic
    const effectiveStatus = status !== undefined ? status : undefined
    if (effectiveStatus !== undefined) {
      updateData.status = effectiveStatus as UserStatus | null

      // Null-out fields that don't belong to the selected status
      if (effectiveStatus !== 'STUDENT') {
        updateData.degreeLevel = null
        updateData.yearOfStudy = null
      }
      if (effectiveStatus !== 'TEACHER') {
        updateData.faculty = null
      }
      if (effectiveStatus !== 'ALUMNI') {
        updateData.alumniYear = null
      }
    }

    // Apply status-specific fields (only if status matches or status not being changed)
    if (yearOfStudy !== undefined && (effectiveStatus === 'STUDENT' || effectiveStatus === undefined)) {
      updateData.yearOfStudy = yearOfStudy !== null ? Number(yearOfStudy) : null
    }
    if (degreeLevel !== undefined && (effectiveStatus === 'STUDENT' || effectiveStatus === undefined)) {
      updateData.degreeLevel = degreeLevel as DegreeLevel | null
    }
    if (faculty !== undefined && (effectiveStatus === 'TEACHER' || effectiveStatus === undefined)) {
      updateData.faculty = faculty !== null ? faculty.trim() : null
    }
    if (alumniYear !== undefined && (effectiveStatus === 'ALUMNI' || effectiveStatus === undefined)) {
      updateData.alumniYear = alumniYear !== null ? Number(alumniYear) : null
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        isAnonymous: true,
        email: true,
        status: true,
        yearOfStudy: true,
        degreeLevel: true,
        faculty: true,
        alumniYear: true,
        isProfileComplete: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('PATCH /api/profile error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
