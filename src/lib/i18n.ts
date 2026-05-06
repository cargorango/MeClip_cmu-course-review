export type Lang = 'th' | 'en'

export const translations = {
  th: {
    appName: 'CMU Course Review',
    appDesc: 'ค้นหาและรีวิวกระบวนวิชาของมหาวิทยาลัยเชียงใหม่',
    heroTitle: 'รีวิวกระบวนวิชา มช.',
    searchPlaceholder: 'ค้นหากระบวนวิชา (รหัสวิชา หรือ ชื่อวิชา)',
    searchPlaceholderEn: 'Search courses (code or name)',
    notFound: 'ไม่พบกระบวนวิชา',
    notFoundSub: 'ลองค้นหาด้วยคำอื่น',
    topCourses: 'วิชายอดนิยม (รีวิวมากที่สุด)',
    reviews: 'รีวิว',
    noRating: 'ยังไม่มีคะแนน',
    login: 'เข้าสู่ระบบ',
    profile: 'โปรไฟล์',
    back: 'ย้อนกลับ',
    searching: 'กำลังค้นหา...',
    difficulty: 'ความยากของวิชา',
    reviewRoom: 'ห้องรีวิว',
    reviewRoomDesc: 'พูดคุยและแชร์ประสบการณ์เกี่ยวกับวิชานี้',
    logout: 'ออกจากระบบ',
  },
  en: {
    appName: 'CMU Course Review',
    appDesc: 'Search and review courses at Chiang Mai University',
    heroTitle: 'CMU Course Reviews',
    searchPlaceholder: 'Search courses (code or name)',
    searchPlaceholderEn: 'Search courses (code or name)',
    notFound: 'No courses found',
    notFoundSub: 'Try a different keyword',
    topCourses: 'Top Courses (Most Reviewed)',
    reviews: 'reviews',
    noRating: 'No rating yet',
    login: 'Sign In',
    profile: 'Profile',
    back: 'Back',
    searching: 'Searching...',
    difficulty: 'Difficulty Rating',
    reviewRoom: 'Review Room',
    reviewRoomDesc: 'Chat and share your experience about this course',
    logout: 'Sign Out',
  },
} as const

export function t(lang: Lang, key: keyof typeof translations.th): string {
  return translations[lang][key]
}
