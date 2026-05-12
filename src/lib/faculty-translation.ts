/**
 * Faculty name translation utility module.
 * Pure functions — no side effects, never throws.
 */

export type Lang = 'th' | 'en'

/**
 * Static mapping of English faculty names (as stored in the database)
 * to their Thai display names. Contains exactly 28 entries.
 */
export const FACULTY_TRANSLATION_MAP: Record<string, string> = {
  "Faculty of Agriculture": "คณะเกษตรศาสตร์",
  "Faculty of Agro-Industry": "คณะอุตสาหกรรมเกษตร",
  "Faculty of Architecture": "คณะสถาปัตยกรรมศาสตร์",
  "Faculty of Associated Medical Sciences": "คณะเทคนิคการแพทย์",
  "Faculty of Business Administration": "คณะบริหารธุรกิจ",
  "Faculty of Dentistry": "คณะทันตแพทยศาสตร์",
  "Faculty of Economics": "คณะเศรษฐศาสตร์",
  "Faculty of Education": "คณะศึกษาศาสตร์",
  "Faculty of Engineering": "คณะวิศวกรรมศาสตร์",
  "Faculty of Fine Arts": "คณะวิจิตรศิลป์",
  "Faculty of Humanities": "คณะมนุษยศาสตร์",
  "Faculty of Law": "คณะนิติศาสตร์",
  "Faculty of Mass Communication": "คณะการสื่อสารมวลชน",
  "Faculty of Medicine": "คณะแพทยศาสตร์",
  "Faculty of Nursing": "คณะพยาบาลศาสตร์",
  "Faculty of Pharmacy": "คณะเภสัชศาสตร์",
  "Faculty of Political Science and Public Administration": "คณะรัฐศาสตร์และรัฐประศาสนศาสตร์",
  "Faculty of Public Health": "คณะสาธารณสุขศาสตร์",
  "Faculty of Science": "คณะวิทยาศาสตร์",
  "Faculty of Social Sciences": "คณะสังคมศาสตร์",
  "Faculty of Veterinary Medicine": "คณะสัตวแพทยศาสตร์",
  "Biomedical Engineering Institute": "สถาบันวิศวกรรมชีวการแพทย์",
  "College of Arts, Media and Technology": "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี",
  "College of Marine Studies and Management": "วิทยาลัยการศึกษาและการจัดการทางทะเล",
  "International College of Digital Innovation": "วิทยาลัยนานาชาตินวัตกรรมดิจิทัล",
  "Multidisciplinary and Interdisciplinary School": "สหสาขาวิชา",
  "Research Institute for Health Sciences": "สถาบันวิจัยวิทยาศาสตร์สุขภาพ",
  "School of Public Policy": "วิทยาลัยนโยบายสาธารณะและรัฐกิจ",
}

/**
 * Translates a faculty name based on the current language.
 * Pure function — no side effects, never throws.
 *
 * @param name - The English faculty name from the database
 * @param lang - Current language ('th' | 'en')
 * @returns
 *   - Empty string if name is empty, null, or undefined
 *   - Original name if lang is 'en'
 *   - Thai name from map if lang is 'th' and name exists in map
 *   - Original name as fallback if lang is 'th' and name is not in map
 */
export function translateFacultyName(name: string, lang: Lang): string {
  // Guard: return empty string for falsy inputs
  if (!name) return ''

  // English mode: return original name unchanged
  if (lang === 'en') return name

  // Thai mode: look up in map, fall back to original name if not found
  return FACULTY_TRANSLATION_MAP[name] ?? name
}
