import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'กรุณาระบุ courseId' }, { status: 400 })
    }

    const userId = session.user.id

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'ไม่พบกระบวนวิชา' }, { status: 404 })
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.courseBookmark.findUnique({
      where: { courseId_userId: { courseId, userId } },
    })

    if (existingBookmark) {
      // Delete the bookmark (toggle off)
      await prisma.courseBookmark.delete({
        where: { courseId_userId: { courseId, userId } },
      })
      return NextResponse.json({ bookmarked: false })
    } else {
      // Create the bookmark (toggle on)
      await prisma.courseBookmark.create({
        data: { courseId, userId },
      })
      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error('POST /api/bookmarks error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'กรุณาระบุ courseId' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    if (!userId) {
      return NextResponse.json({ bookmarked: false })
    }

    const bookmark = await prisma.courseBookmark.findUnique({
      where: { courseId_userId: { courseId, userId } },
    })

    return NextResponse.json({ bookmarked: !!bookmark })
  } catch (error) {
    console.error('GET /api/bookmarks error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
