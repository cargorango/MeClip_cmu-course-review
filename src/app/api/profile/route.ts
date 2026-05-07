import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'
import { validateDisplayName } from '@/lib/validation'
import { UserStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, displayName: true, isAnonymous: true, email: true, role: true, status: true, yearOfStudy: true, isProfileComplete: true },
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
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { displayName, isAnonymous, status, yearOfStudy, isProfileComplete } = body

    // Validate display name if provided
    if (displayName !== undefined) {
      if (!validateDisplayName(displayName)) {
        return NextResponse.json(
          { error: 'ชื่อต้องมีความยาว 1-50 ตัวอักษร' },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (status !== undefined && status !== null) {
      const validStatuses: UserStatus[] = ['STUDENT', 'TEACHER', 'ALUMNI']
      if (!validStatuses.includes(status as UserStatus)) {
        return NextResponse.json(
          { error: 'สถานะไม่ถูกต้อง' },
          { status: 400 }
        )
      }
    }

    // Validate yearOfStudy
    if (yearOfStudy !== undefined && yearOfStudy !== null) {
      const year = Number(yearOfStudy)
      if (!Number.isInteger(year) || year < 1 || year > 6) {
        return NextResponse.json(
          { error: 'ชั้นปีต้องอยู่ระหว่าง 1-6' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (displayName !== undefined) updateData.displayName = displayName.trim()
    if (isAnonymous !== undefined) updateData.isAnonymous = Boolean(isAnonymous)
    if (status !== undefined) updateData.status = status as UserStatus | null
    if (yearOfStudy !== undefined) updateData.yearOfStudy = yearOfStudy !== null ? Number(yearOfStudy) : null
    if (isProfileComplete !== undefined) updateData.isProfileComplete = Boolean(isProfileComplete)

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
        isProfileComplete: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('PATCH /api/profile error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
