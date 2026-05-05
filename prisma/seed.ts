import { PrismaClient, ProgramType, Role } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ─── ลบวิชาเก่าที่ไม่ได้อยู่ในหลักสูตรจริง ──────────────────────────────────
  const validCodes = [
    '001101','001102','001201','001228','204100','261111','953111','176104',
    '851100','888102','703103','201114','063101','851103','140104','057139',
    '154104','951100','127101','206171','208271','701100','176101','176220',
    '154281','888111','888121','888147','954140','013103','126101','204101',
    '204102','702100','954100','751106','751202','751209','751301','751302',
    '751303','751304','751305','751308','751309','751401','751403','751405',
    '751408','751409','751220','751320','751321','751322','751323','751325',
    '751326','751327','751330','751332','751340','751342','751345','751347',
    '751411','751413','751414','751416','751417','751418','751419','751420',
    '751421','751422','751424','751425','751427','751428','751429','751434',
    '751437','751440','751441','751442','751443','751444','751445','751446',
    '751447','751448','751449','751451','751452','751453','751454','751471',
    '751472',
  ]
  const deleted = await prisma.course.deleteMany({
    where: { code: { notIn: validCodes } },
  })
  if (deleted.count > 0) {
    console.log(`🗑️  Removed ${deleted.count} outdated courses`)
  }

  // ─── Faculty: คณะเศรษฐศาสตร์ ───────────────────────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where: { id: 'faculty-economics' },
    update: {},
    create: {
      id: 'faculty-economics',
      name: 'Faculty of Economics',
      nameTh: 'คณะเศรษฐศาสตร์',
    },
  })
  console.log(`✅ Faculty: ${faculty.nameTh}`)

  // ─── Curricula ──────────────────────────────────────────────────────────────
  const curriculumRegular2024 = await prisma.curriculum.upsert({
    where: { id: 'curriculum-regular-2024' },
    update: {},
    create: {
      id: 'curriculum-regular-2024',
      facultyId: faculty.id,
      programType: ProgramType.REGULAR,
      curriculumYear: 2024,
    },
  })

  await prisma.curriculum.upsert({
    where: { id: 'curriculum-regular-2025' },
    update: {},
    create: {
      id: 'curriculum-regular-2025',
      facultyId: faculty.id,
      programType: ProgramType.REGULAR,
      curriculumYear: 2025,
    },
  })

  await prisma.curriculum.upsert({
    where: { id: 'curriculum-intl-2024' },
    update: {},
    create: {
      id: 'curriculum-intl-2024',
      facultyId: faculty.id,
      programType: ProgramType.INTERNATIONAL,
      curriculumYear: 2024,
    },
  })

  await prisma.curriculum.upsert({
    where: { id: 'curriculum-intl-2025' },
    update: {},
    create: {
      id: 'curriculum-intl-2025',
      facultyId: faculty.id,
      programType: ProgramType.INTERNATIONAL,
      curriculumYear: 2025,
    },
  })

  console.log('✅ Curricula: 4 curricula created')

  // ─── Courses: หลักสูตรเศรษฐศาสตรบัณฑิต ภาคปกติ พ.ศ.2563 (ปรับปรุง 2024) ────
  // หมวดวิชาศึกษาทั่วไป (General Education Courses)
  const generalEducationCourses = [
    { id: 'course-001101', code: '001101', name: 'Fundamental English 1', nameTh: 'ภาษาอังกฤษพื้นฐาน 1' },
    { id: 'course-001102', code: '001102', name: 'Fundamental English 2', nameTh: 'ภาษาอังกฤษพื้นฐาน 2' },
    { id: 'course-001201', code: '001201', name: 'Critical Reading and Effective Writing', nameTh: 'การอ่านเชิงวิเคราะห์และการเขียนอย่างมีประสิทธิผล' },
    { id: 'course-001228', code: '001228', name: 'English for Business and Economics', nameTh: 'ภาษาอังกฤษสำหรับธุรกิจและเศรษฐศาสตร์' },
    { id: 'course-204100', code: '204100', name: 'Information Technology and Modern Life', nameTh: 'เทคโนโลยีสารสนเทศและชีวิตสมัยใหม่' },
    { id: 'course-261111', code: '261111', name: 'Internet and Online Community', nameTh: 'อินเทอร์เน็ตและสังคมออนไลน์' },
    { id: 'course-953111', code: '953111', name: 'Software for Everyday Life', nameTh: 'ซอฟแวร์สำหรับชีวิตประจำวัน' },
    { id: 'course-176104', code: '176104', name: 'Rights and Duties of Citizen in Digital Age', nameTh: 'สิทธิและหน้าที่พลเมืองในยุคดิจิทัล' },
    { id: 'course-851100', code: '851100', name: 'Introduction to Communication', nameTh: 'การสื่อสารเบื้องต้น' },
    { id: 'course-888102', code: '888102', name: 'Big Data for Business', nameTh: 'อภิมหาข้อมูลเพื่อธุรกิจ' },
    { id: 'course-703103', code: '703103', name: 'Introduction to Entrepreneurship and Business', nameTh: 'การเป็นผู้ประกอบการและธุรกิจเบื้องต้น' },
    { id: 'course-201114', code: '201114', name: 'Environmental Science in Today\'s World', nameTh: 'วิทยาศาสตร์สิ่งแวดล้อมในโลกปัจจุบัน' },
    { id: 'course-063101', code: '063101', name: 'Learning for Self-Development', nameTh: 'การเรียนรู้เพื่อการพัฒนาตนเอง' },
    { id: 'course-851103', code: '851103', name: 'Life and Society through Media', nameTh: 'ชีวิตและสังคมผ่านสื่อ' },
    { id: 'course-140104', code: '140104', name: 'Citizenship', nameTh: 'การเป็นพลเมือง' },
    { id: 'course-057139', code: '057139', name: 'Sport and Adventure Tourism', nameTh: 'การท่องเที่ยวเชิงกีฬาและผจญภัย' },
    { id: 'course-154104', code: '154104', name: 'Environmental Conservation', nameTh: 'การอนุรักษ์สิ่งแวดล้อม' },
    { id: 'course-951100', code: '951100', name: 'Modern Life and Animation', nameTh: 'ชีวิตสมัยใหม่กับแอนนิเมชัน' },
  ]

  // วิชาแกน (Core Courses)
  const coreCourses = [
    { id: 'course-127101', code: '127101', name: 'Introduction to Political Science', nameTh: 'ความรู้เบื้องต้นเกี่ยวกับรัฐศาสตร์' },
    { id: 'course-206171', code: '206171', name: 'General Mathematics 1', nameTh: 'คณิตศาสตร์ทั่วไป 1' },
    { id: 'course-208271', code: '208271', name: 'Elementary Statistics for Social Sciences 1', nameTh: 'สถิติเบื้องต้นสำหรับสังคมศาสตร์ 1' },
    { id: 'course-701100', code: '701100', name: 'Elementary Accounting 1', nameTh: 'การบัญชีขั้นต้น 1' },
    { id: 'course-176101', code: '176101', name: 'Introduction to Law', nameTh: 'ความรู้เบื้องต้นเกี่ยวกับกฎหมายทั่วไป' },
    { id: 'course-176220', code: '176220', name: 'Fundamental Business Law', nameTh: 'กฎหมายธุรกิจเบื้องต้น' },
    { id: 'course-154281', code: '154281', name: 'Economic Geography', nameTh: 'ภูมิศาสตร์เศรษฐกิจ' },
    { id: 'course-888111', code: '888111', name: 'Innovative Entrepreneurship Theory and Practice', nameTh: 'ทฤษฎีและการปฏิบัติในการเป็นผู้ประกอบการนวัตกรรม' },
    { id: 'course-888121', code: '888121', name: 'Digital Economy', nameTh: 'เศรษฐศาสตร์ดิจิทัล' },
    { id: 'course-888147', code: '888147', name: 'Innovation for Entrepreneur', nameTh: 'นวัตกรรมสำหรับผู้ประกอบการ' },
    { id: 'course-954140', code: '954140', name: 'Information Technology Literacy', nameTh: 'พื้นฐานเทคโนโลยีสารสนเทศ' },
    { id: 'course-013103', code: '013103', name: 'General Psychology', nameTh: 'จิตวิทยาทั่วไป' },
    { id: 'course-126101', code: '126101', name: 'Introduction to International Relations', nameTh: 'ความรู้เบื้องต้นทางความสัมพันธ์ระหว่างประเทศ' },
    { id: 'course-204101', code: '204101', name: 'Introduction to Computer', nameTh: 'คอมพิวเตอร์เบื้องต้น' },
    { id: 'course-204102', code: '204102', name: 'Intelligent Data Analysis: Survey of Techniques and Applications', nameTh: 'การวิเคราะห์ข้อมูลอัจฉริยะ: การสำรวจด้านเทคนิคและการประยุกต์' },
    { id: 'course-702100', code: '702100', name: 'Introduction to Entrepreneurial Finance', nameTh: 'การเงินเบื้องต้นสำหรับผู้ประกอบการ' },
    { id: 'course-954100', code: '954100', name: 'Information System for Organization Management', nameTh: 'ระบบสารสนเทศเพื่อการบริหารและจัดการองค์กร' },
  ]

  // วิชาเอกบังคับ (Required Major Courses)
  const requiredMajorCourses = [
    { id: 'course-751106', code: '751106', name: 'Principles of Economics', nameTh: 'หลักเศรษฐศาสตร์' },
    { id: 'course-751202', code: '751202', name: 'History of Economic Thought', nameTh: 'ประวัติลัทธิเศรษฐกิจ' },
    { id: 'course-751209', code: '751209', name: 'Introduction to Mathematical Economics', nameTh: 'คณิตเศรษฐศาสตร์เบื้องต้น' },
    { id: 'course-751301', code: '751301', name: 'Microeconomic Theory 1', nameTh: 'ทฤษฎีเศรษฐศาสตร์จุลภาค 1' },
    { id: 'course-751302', code: '751302', name: 'Microeconomic Theory 2', nameTh: 'ทฤษฎีเศรษฐศาสตร์จุลภาค 2' },
    { id: 'course-751303', code: '751303', name: 'Public Finance', nameTh: 'การคลังสาธารณะ' },
    { id: 'course-751304', code: '751304', name: 'Economic Statistics', nameTh: 'เศรษฐศาสตร์สถิติ' },
    { id: 'course-751305', code: '751305', name: 'Econometrics 1', nameTh: 'เศรษฐมิติ 1' },
    { id: 'course-751308', code: '751308', name: 'Macroeconomic Theory 1', nameTh: 'ทฤษฎีเศรษฐศาสตร์มหภาค 1' },
    { id: 'course-751309', code: '751309', name: 'Macroeconomic Theory 2', nameTh: 'ทฤษฎีเศรษฐศาสตร์มหภาค 2' },
    { id: 'course-751401', code: '751401', name: 'International Economics', nameTh: 'เศรษฐศาสตร์ระหว่างประเทศ' },
    { id: 'course-751403', code: '751403', name: 'Econometrics 2', nameTh: 'เศรษฐมิติ 2' },
    { id: 'course-751405', code: '751405', name: 'Theory of Economic Development', nameTh: 'ทฤษฎีพัฒนาเศรษฐกิจ' },
    { id: 'course-751408', code: '751408', name: 'Research Methods in Economics', nameTh: 'ระเบียบวิธีวิจัยทางเศรษฐศาสตร์' },
    { id: 'course-751409', code: '751409', name: 'Research Exercise in Current Economics Issues', nameTh: 'แบบฝึกหัดการวิจัยปัญหาเศรษฐกิจปัจจุบัน' },
  ]

  // วิชาเอกเลือก (Elective Major Courses)
  const electiveMajorCourses = [
    { id: 'course-751220', code: '751220', name: 'Economic History', nameTh: 'ประวัติศาสตร์เศรษฐกิจ' },
    { id: 'course-751320', code: '751320', name: 'International Business Economics', nameTh: 'เศรษฐศาสตร์ธุรกิจระหว่างประเทศ' },
    { id: 'course-751321', code: '751321', name: 'Community Economic Development', nameTh: 'การพัฒนาเศรษฐกิจชุมชน' },
    { id: 'course-751322', code: '751322', name: 'International Political Economy', nameTh: 'เศรษฐกิจการเมืองระหว่างประเทศ' },
    { id: 'course-751323', code: '751323', name: 'Modern Chinese Economy', nameTh: 'เศรษฐกิจจีนยุคใหม่' },
    { id: 'course-751325', code: '751325', name: 'American Marketing Economics', nameTh: 'เศรษฐศาสตร์การตลาดสหรัฐอเมริกา' },
    { id: 'course-751326', code: '751326', name: 'ASEAN Economy in the Global Economic Context', nameTh: 'เศรษฐกิจอาเซียนในบริบทของเศรษฐกิจโลก' },
    { id: 'course-751327', code: '751327', name: 'ICT Economics and Telecommunications Policy', nameTh: 'เศรษฐศาสตร์เทคโนโลยีสารสนเทศและการสื่อสารและนโยบายโทรคมนาคม' },
    { id: 'course-751330', code: '751330', name: 'Money and Banking', nameTh: 'การเงินและการธนาคาร' },
    { id: 'course-751332', code: '751332', name: 'Monetary Theory', nameTh: 'ทฤษฎีการเงิน' },
    { id: 'course-751340', code: '751340', name: 'Introduction to Agricultural Economics', nameTh: 'เศรษฐศาสตร์การเกษตรเบื้องต้น' },
    { id: 'course-751342', code: '751342', name: 'Land Economics', nameTh: 'เศรษฐศาสตร์ที่ดิน' },
    { id: 'course-751345', code: '751345', name: 'Transportation Economics', nameTh: 'เศรษฐศาสตร์การขนส่ง' },
    { id: 'course-751347', code: '751347', name: 'Cooperative Economics', nameTh: 'เศรษฐศาสตร์สหกรณ์' },
    { id: 'course-751411', code: '751411', name: 'The Economics of European Economic Integration', nameTh: 'เศรษฐศาสตร์การรวมกลุ่มเศรษฐกิจของยุโรป' },
    { id: 'course-751413', code: '751413', name: 'Introduction to Input-Output Analysis', nameTh: 'การวิเคราะห์อินพุท-เอาท์พุทเบื้องต้น' },
    { id: 'course-751414', code: '751414', name: 'Introduction to Applied Econometrics', nameTh: 'เศรษฐมิติประยุกต์เบื้องต้น' },
    { id: 'course-751416', code: '751416', name: 'Mathematical Economics', nameTh: 'คณิตเศรษฐศาสตร์' },
    { id: 'course-751417', code: '751417', name: 'Managerial Economics', nameTh: 'เศรษฐศาสตร์การจัดการ' },
    { id: 'course-751418', code: '751418', name: 'Business Cycle Theory', nameTh: 'ทฤษฎีวัฎจักรธุรกิจ' },
    { id: 'course-751419', code: '751419', name: 'Economic Theory and Entrepreneurship', nameTh: 'ทฤษฎีเศรษฐศาสตร์และการประกอบการ' },
    { id: 'course-751420', code: '751420', name: 'International Finance', nameTh: 'การเงินระหว่างประเทศ' },
    { id: 'course-751421', code: '751421', name: 'Economics of Investment', nameTh: 'เศรษฐศาสตร์การลงทุน' },
    { id: 'course-751422', code: '751422', name: 'Technical Analysis for Investment', nameTh: 'การวิเคราะห์เชิงเทคนิคสำหรับการลงทุน' },
    { id: 'course-751424', code: '751424', name: 'Economic Development of Developing Countries', nameTh: 'การพัฒนาเศรษฐกิจของประเทศกำลังพัฒนา' },
    { id: 'course-751425', code: '751425', name: 'Economic Growth', nameTh: 'การเจริญเติบโตทางเศรษฐกิจ' },
    { id: 'course-751427', code: '751427', name: 'Economic Planning', nameTh: 'การวางแผนเศรษฐกิจ' },
    { id: 'course-751428', code: '751428', name: 'Political Economy', nameTh: 'เศรษฐศาสตร์การเมือง' },
    { id: 'course-751429', code: '751429', name: 'Comparative Economic System', nameTh: 'ระบบเศรษฐกิจเปรียบเทียบ' },
    { id: 'course-751434', code: '751434', name: 'Commercial Banking', nameTh: 'การธนาคารพาณิชย์' },
    { id: 'course-751437', code: '751437', name: 'Tax System', nameTh: 'ระบบภาษีอากร' },
    { id: 'course-751440', code: '751440', name: 'Labor Economics', nameTh: 'เศรษฐศาสตร์แรงงาน' },
    { id: 'course-751441', code: '751441', name: 'Economics of Water Resources', nameTh: 'เศรษฐศาสตร์ทรัพยากรน้ำ' },
    { id: 'course-751442', code: '751442', name: 'Regional Economics', nameTh: 'เศรษฐศาสตร์ภูมิภาค' },
    { id: 'course-751443', code: '751443', name: 'Industrial Economics', nameTh: 'เศรษฐศาสตร์อุตสาหกรรม' },
    { id: 'course-751444', code: '751444', name: 'Urban Economics', nameTh: 'เศรษฐศาสตร์เมือง' },
    { id: 'course-751445', code: '751445', name: 'Natural Resource Allocation and Policy', nameTh: 'นโยบายและการจัดสรรทรัพยากรธรรมชาติ' },
    { id: 'course-751446', code: '751446', name: 'Economy of Thailand', nameTh: 'เศรษฐกิจของประเทศไทย' },
    { id: 'course-751447', code: '751447', name: 'Seminar in Current Economic Problems', nameTh: 'สัมมนาปัญหาเศรษฐกิจปัจจุบัน' },
    { id: 'course-751448', code: '751448', name: 'Seminar in Global Investment Issues', nameTh: 'สัมมนาประเด็นการลงทุนทั่วโลก' },
    { id: 'course-751449', code: '751449', name: 'Cooperative Education', nameTh: 'สหกิจศึกษา' },
    { id: 'course-751451', code: '751451', name: 'Health Economics', nameTh: 'เศรษฐศาสตร์สุขภาพ' },
    { id: 'course-751452', code: '751452', name: 'Economics of Climate Change', nameTh: 'เศรษฐศาสตร์การเปลี่ยนแปลงภูมิอากาศ' },
    { id: 'course-751453', code: '751453', name: 'Developing Application for Data Analytics in Economics', nameTh: 'การพัฒนาแอปพลิเคชันเพื่อวิเคราะห์ข้อมูลทางเศรษฐศาสตร์' },
    { id: 'course-751454', code: '751454', name: 'Behavioral Economics', nameTh: 'เศรษฐศาสตร์พฤติกรรม' },
    { id: 'course-751471', code: '751471', name: 'Economics of Decentralized Finance', nameTh: 'เศรษฐศาสตร์การเงินแบบไร้ตัวกลาง' },
    { id: 'course-751472', code: '751472', name: 'Economics of Tokenomics and Non-Fungible Token', nameTh: 'เศรษฐศาสตร์ที่เกี่ยวข้องกับเหรียญและเหรียญที่ไม่สามารถทดแทนกันได้' },
  ]

  const allCourses = [
    ...generalEducationCourses,
    ...coreCourses,
    ...requiredMajorCourses,
    ...electiveMajorCourses,
  ]

  for (const course of allCourses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: {
        ...course,
        facultyId: faculty.id,
        curriculumId: curriculumRegular2024.id,
      },
    })
  }

  console.log(`✅ Courses (ภาคปกติ 2024 - หลักสูตรเศรษฐศาสตรบัณฑิต พ.ศ.2563): ${allCourses.length} courses`)
  console.log(`   - หมวดวิชาศึกษาทั่วไป: ${generalEducationCourses.length} courses`)
  console.log(`   - วิชาแกน: ${coreCourses.length} courses`)
  console.log(`   - วิชาเอกบังคับ: ${requiredMajorCourses.length} courses`)
  console.log(`   - วิชาเอกเลือก: ${electiveMajorCourses.length} courses`)

  // ─── Super Admin ─────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'Patakarawin2547@gmail.com' },
    update: { role: Role.SUPER_ADMIN },
    create: {
      email: 'Patakarawin2547@gmail.com',
      displayName: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  })
  console.log(`✅ Super Admin: ${superAdmin.email} (${superAdmin.role})`)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
