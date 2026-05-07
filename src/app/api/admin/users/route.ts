import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { validateDisplayName } from '@/lib/validation'
import { calculateReviewerLevel } from '@/lib/reviewer-level'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'กรุณาเข้าสู่ระบบก่อน', status: 401, session: null }
  }
  const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER']
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
    const q = searchParams.get('q') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where = q
      ? { email: { contains: q, mode: 'insensitive' as const } }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          isAnonymous: true,
          createdAt: true,
          _count: { select: { ratings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const usersWithLevel = users.map(u => ({
      ...u,
      reviewerLevel: calculateReviewerLevel(u._count.ratings),
      totalRatings: u._count.ratings,
    }))

    return NextResponse.json({
      users: usersWithLevel,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const body = await request.json()
    const { userId, displayName, email } = body

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุ userId' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Build update data
    const updateData: { displayName?: string; email?: string } = {}

    if (displayName !== undefined) {
      if (!validateDisplayName(displayName)) {
        return NextResponse.json(
          { error: 'ชื่อต้องมีความยาว 1-50 ตัวอักษร' },
          { status: 400 }
        )
      }
      updateData.displayName = displayName.trim()
    }

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json({ error: 'รูปแบบ Email ไม่ถูกต้อง' }, { status: 400 })
      }
      // Check email uniqueness
      const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } })
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Email นี้ถูกใช้งานแล้ว' }, { status: 409 })
      }
      updateData.email = trimmedEmail
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่ต้องการอัปเดต' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, displayName: true, role: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/admin/users error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุ userId' }, { status: 400 })
    }

    // Prevent deleting yourself
    if (userId === session!.user.id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Prevent deleting Platform Manager
    if (user.role === 'PLATFORM_MANAGER') {
      return NextResponse.json({ error: 'ไม่สามารถลบ Platform Manager ได้' }, { status: 403 })
    }

    // Use a unique deleted email to avoid conflicts
    const deletedEmail = `deleted_${userId}@deleted.invalid`

    // Delete auth accounts and sessions first
    await prisma.account.deleteMany({ where: { userId } })
    await prisma.session.deleteMany({ where: { userId } })

    // Anonymize user data (soft delete — keep record for message FK integrity)
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: deletedEmail,
        displayName: 'ผู้ใช้ที่ถูกลบ',
        isAnonymous: true,
        password: null,
      },
    })

    return NextResponse.json({ message: 'ลบบัญชีผู้ใช้เรียบร้อย' })
  } catch (err) {
    console.error('DELETE /api/admin/users error:', err)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
