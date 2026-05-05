import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'
import { validateDisplayName } from '@/lib/validation'

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
    const { displayName, isAnonymous } = body

    // Validate display name if provided
    if (displayName !== undefined) {
      if (!validateDisplayName(displayName)) {
        return NextResponse.json(
          { error: 'ชื่อต้องมีความยาว 1-50 ตัวอักษร' },
          { status: 400 }
        )
      }
    }

    const updateData: { displayName?: string; isAnonymous?: boolean } = {}
    if (displayName !== undefined) updateData.displayName = displayName.trim()
    if (isAnonymous !== undefined) updateData.isAnonymous = Boolean(isAnonymous)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        isAnonymous: true,
        email: true,
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
