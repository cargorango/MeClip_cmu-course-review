const PROFANITY_LIST = [
  'ควย', 'เหี้ย', 'สัส', 'หี', 'เย็ด', 'สัตว์', 'ไอ้สัส', 'มึง', 'กู', 'อีสัส',
  'ไอ้หน้าหี', 'ไอ้เหี้ย', 'อีเหี้ย', 'ไอ้ควย', 'อีควย'
]

export function containsProfanity(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return PROFANITY_LIST.some(word => lowerContent.includes(word.toLowerCase()))
}

export { PROFANITY_LIST }
