// Maps short English faculty names (as stored in DB) to Thai display names
const FACULTY_TH: Record<string, string> = {
  'Agriculture': 'คณะเกษตรศาสตร์',
  'Agro-Industry': 'คณะอุตสาหกรรมเกษตร',
  'Architecture': 'คณะสถาปัตยกรรมศาสตร์',
  'Associated Medical Sciences': 'คณะเทคนิคการแพทย์',
  'Biomedical Engineering Institute': 'สถาบันวิศวกรรมชีวการแพทย์',
  'Business Administration': 'คณะบริหารธุรกิจ',
  'College of Arts, Media and Technology': 'วิทยาลัยศิลปะ สื่อ และเทคโนโลยี',
  'College of Marine Studies and Management': 'วิทยาลัยการศึกษาและการจัดการทางทะเล',
  'Dentistry': 'คณะทันตแพทยศาสตร์',
  'Economics': 'คณะเศรษฐศาสตร์',
  'Education': 'คณะศึกษาศาสตร์',
  'Engineering': 'คณะวิศวกรรมศาสตร์',
  'Fine Arts': 'คณะวิจิตรศิลป์',
  'Humanities': 'คณะมนุษยศาสตร์',
  'International College': 'วิทยาลัยนานาชาติ',
  'International College of Digital Innovation': 'วิทยาลัยนานาชาตินวัตกรรมดิจิทัล',
  'Law': 'คณะนิติศาสตร์',
  'Mass Communication': 'คณะการสื่อสารมวลชน',
  'Medicine': 'คณะแพทยศาสตร์',
  'Multidisciplinary and Interdisciplinary School': 'บัณฑิตวิทยาลัยสหสาขาวิชา',
  'Nursing': 'คณะพยาบาลศาสตร์',
  'Pharmacy': 'คณะเภสัชศาสตร์',
  'Political Science and Public Administration': 'คณะรัฐศาสตร์และรัฐประศาสนศาสตร์',
  'Public Health': 'คณะสาธารณสุขศาสตร์',
  'Research Institute for Health Sciences': 'สถาบันวิจัยวิทยาศาสตร์สุขภาพ',
  'School of Public Policy': 'วิทยาลัยนโยบายสาธารณะและรัฐกิจ',
  'Science': 'คณะวิทยาศาสตร์',
  'Social Sciences': 'คณะสังคมศาสตร์',
  'Veterinary Medicine': 'คณะสัตวแพทยศาสตร์',
}

/**
 * Returns Thai display name for a faculty.
 * Accepts short English names ("Agriculture") or full names ("Faculty of Agriculture").
 * Falls back to the input string if no mapping found.
 */
export function toThaiName(name: string | null | undefined): string {
  if (!name) return ''
  const short = name.replace(/^Faculty of\s+/i, '').trim()
  return FACULTY_TH[short] ?? FACULTY_TH[name] ?? name
}
