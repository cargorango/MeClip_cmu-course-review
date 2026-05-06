import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface CourseData {
  code: string
  name: string
  nameTh: string
  credits: string
  description: string
}

async function main() {
  console.log('🌱 Seeding free elective courses...')

  // Read JSON file (strip BOM if present)
  const jsonPath = join(__dirname, 'free-electives.json')
  const raw = readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '')
  const courses: CourseData[] = JSON.parse(raw)
  console.log(`📂 Loaded ${courses.length} courses from JSON`)

  // Upsert faculty for free electives
  const faculty = await prisma.faculty.upsert({
    where: { id: 'faculty-free-elective' },
    update: { nameTh: 'วิชาเลือกเสรี' },
    create: {
      id: 'faculty-free-elective',
      name: 'Free Elective Courses',
      nameTh: 'วิชาเลือกเสรี',
    },
  })

  // Upsert curriculum for free electives
  const curriculum = await prisma.curriculum.upsert({
    where: { id: 'curriculum-free-elective' },
    update: {},
    create: {
      id: 'curriculum-free-elective',
      facultyId: faculty.id,
      programType: 'REGULAR',
      curriculumYear: 2024,
    },
  })

  let created = 0
  let updated = 0

  for (const course of courses) {
    const existing = await prisma.course.findUnique({ where: { code: course.code } })

    if (existing) {
      // Update credits, description, and mark as free elective
      await prisma.course.update({
        where: { code: course.code },
        data: {
          credits: course.credits,
          description: course.description,
          isFreeElective: true,
        },
      })
      updated++
    } else {
      // Create new course
      await prisma.course.create({
        data: {
          code: course.code,
          name: course.name,
          nameTh: course.nameTh,
          credits: course.credits,
          description: course.description,
          isFreeElective: true,
          facultyId: faculty.id,
          curriculumId: curriculum.id,
        },
      })
      created++
    }
  }

  console.log(`✅ Done! Created: ${created}, Updated: ${updated}, Total: ${courses.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
