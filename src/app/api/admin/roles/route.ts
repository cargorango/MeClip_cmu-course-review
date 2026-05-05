import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN can manage roles
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'เฉพาะ Super Admin เท่านั้น' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, action } = body

    if (!userId || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Cannot change Super Admin role
    if (targetUser.role === Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'ไม่สามารถเปลี่ยนสิทธิ์ Super Admin ได้' },
        { status: 403 }
      )
    }

    const newRole = action === 'grant' ? Role.ADMIN : Role.STUDENT

    // Update role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        targetId: userId,
        action: action === 'grant' ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
      },
    })

    return NextResponse.json({
      message: action === 'grant' ? 'มอบสิทธิ์ Admin เรียบร้อย' : 'ถอนสิทธิ์ Admin เรียบร้อย',
      userId,
      newRole,
    })
  } catch (error) {
    console.error('PATCH /api/admin/roles error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'เฉพาะ Super Admin เท่านั้น' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          actor: { select: { id: true, displayName: true, email: true } },
          target: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ])

    return NextResponse.json({
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        createdAt: l.createdAt.toISOString(),
        actor: l.actor,
        target: l.target,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/roles error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}
