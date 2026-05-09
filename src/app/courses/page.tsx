import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '../../../auth'
import LangToggle from '@/components/lang-toggle'
import FeedbackButton from '@/components/feedback-button'
import { GraduationCap, ArrowLeft, BookOpen } from 'lucide-react'
import { type Lang } from '@/lib/i18n'
import UserMenu from '@/components/user-menu'
import { isAdminRole } from '@/lib/roles'
import { requireCompleteProfile } from '@/lib/check-onboarding'
import AllCoursesSearch from './all-courses-search'

interface PageProps {
  searchParams: { lang?: string; q?: string; dept?: string }
}

export default async function AllCoursesPage({ searchParams }: PageProps) {
  const session = await auth()
  await requireCompleteProfile()
  const lang: Lang = searchParams.lang === 'en' ? 'en' : 'th'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900 text-sm sm:text-base">CMU Course Review</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <LangToggle currentLang={lang} />
            </Suspense>
            {session?.user ? (
              <UserMenu
                displayName={session.user.displayName ?? session.user.name ?? 'โปรไฟล์'}
                isAdmin={isAdminRole(session.user.role)}
                lang={lang}
              />
            ) : (
              <Link href={`/login?lang=${lang}`} className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                {lang === 'en' ? 'Sign In' : 'เข้าสู่ระบบ'}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link href={`/?lang=${lang}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-blue-300 transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          {lang === 'en' ? 'Back' : 'ย้อนกลับ'}
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-xl p-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lang === 'en' ? 'All Courses' : 'วิชาทั้งหมด'}
            </h1>
            <p className="text-sm text-gray-500">
              {lang === 'en' ? 'Search to find courses' : 'ค้นหาเพื่อแสดงรายการวิชา'}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-12 animate-pulse bg-gray-100 rounded-xl" />}>
          <AllCoursesSearch lang={lang} initialQ={searchParams.q ?? ''} initialDept={searchParams.dept ?? ''} />
        </Suspense>
      </main>

      <FeedbackButton />
    </div>
  )
}
