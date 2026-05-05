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
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
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
    const { userId, displayName } = body

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุ userId' }, { status: 400 })
    }

    if (!validateDisplayName(displayName)) {
      return NextResponse.json(
        { error: 'ชื่อต้องมีความยาว 1-50 ตัวอักษร' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { displayName: displayName.trim() },
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
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุ userId' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Anonymize messages before deleting user
    // Messages are retained but sender info is anonymized via isDeleted=false
    // We update the user to remove personal data but keep the record for message FK
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.invalid`,
        displayName: 'ผู้ใช้ที่ถูกลบ',
        isAnonymous: true,
      },
    })

    // Delete auth accounts and sessions
    await prisma.account.deleteMany({ where: { userId } })
    await prisma.session.deleteMany({ where: { userId } })

    return NextResponse.json({ message: 'ลบบัญชีผู้ใช้เรียบร้อย' })
  } catch (error) {
    console.error('DELETE /api/admin/users error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
