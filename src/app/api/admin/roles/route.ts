import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const PLATFORM_MANAGER_ROLES: Role[] = [Role.PLATFORM_MANAGER, Role.SUPER_ADMIN]
const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.SUPER_ADMIN, Role.PLATFORM_MANAGER, Role.SYSTEM_MANAGER, Role.OPERATIONS_MANAGER]
const CHANGEABLE_ROLES: Role[] = [Role.SYSTEM_MANAGER, Role.OPERATIONS_MANAGER, Role.ADMIN]

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    // Only PLATFORM_MANAGER (or legacy SUPER_ADMIN) can manage roles
    if (!PLATFORM_MANAGER_ROLES.includes(session.user.role as Role)) {
      return NextResponse.json({ error: 'เฉพาะ Platform Manager เท่านั้น' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, newRole } = body

    if (!userId || !['grant', 'revoke', 'change_role'].includes(action)) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 })
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Cannot change Platform Manager role
    if (targetUser.role === Role.PLATFORM_MANAGER || targetUser.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนสิทธิ์ Platform Manager ได้' }, { status: 403 })
    }

    let finalRole: Role
    let auditAction: string

    if (action === 'grant') {
      finalRole = Role.SYSTEM_MANAGER
      auditAction = 'GRANT_ADMIN'
    } else if (action === 'revoke') {
      finalRole = Role.STUDENT
      auditAction = 'REVOKE_ADMIN'
    } else if (action === 'change_role') {
      // Validate newRole
      if (!newRole || !CHANGEABLE_ROLES.includes(newRole as Role)) {
        return NextResponse.json({ error: 'Role ไม่ถูกต้อง' }, { status: 400 })
      }
      // Target must currently be an admin
      if (!ADMIN_ROLES.includes(targetUser.role)) {
        return NextResponse.json({ error: 'ผู้ใช้ไม่ใช่ Admin' }, { status: 400 })
      }
      finalRole = newRole as Role
      auditAction = `CHANGE_ROLE_TO_${newRole}`
    } else {
      return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 })
    }

    // Update role
    await prisma.user.update({
      where: { id: userId },
      data: { role: finalRole },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        targetId: userId,
        action: auditAction,
      },
    })

    return NextResponse.json({
      message: 'อัปเดต role เรียบร้อย',
      userId,
      newRole: finalRole,
    })
  } catch (error) {
    console.error('PATCH /api/admin/roles error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    if (!PLATFORM_MANAGER_ROLES.includes(session.user.role as Role)) {
      return NextResponse.json({ error: 'เฉพาะ Platform Manager เท่านั้น' }, { status: 403 })
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
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
