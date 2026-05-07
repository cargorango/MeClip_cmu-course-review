import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'
import LoginForm from './login-form'

interface LoginPageProps {
  searchParams: { callbackUrl?: string; error?: string }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()

  // Already logged in — redirect
  if (session?.user) {
    redirect(searchParams.callbackUrl ?? '/')
  }

  const callbackUrl = searchParams.callbackUrl ?? '/'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 rounded-2xl p-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CMU Course Review</h1>
          <p className="text-sm text-gray-500">เข้าสู่ระบบเพื่อรีวิวกระบวนวิชา</p>
        </div>

        {/* Error message */}
        {searchParams.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {searchParams.error === 'OAuthSignin' && 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่'}
            {searchParams.error === 'OAuthCallback' && 'เกิดข้อผิดพลาดจาก Google กรุณาลองใหม่'}
            {searchParams.error === 'OAuthCreateAccount' && 'ไม่สามารถสร้างบัญชีได้ กรุณาติดต่อผู้ดูแลระบบ'}
            {searchParams.error === 'CredentialsSignin' && 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'}
            {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'CredentialsSignin'].includes(searchParams.error) &&
              'เกิดข้อผิดพลาด กรุณาลองใหม่'}
          </div>
        )}

        {/* Login form (client component) */}
        <LoginForm callbackUrl={callbackUrl} />

        <p className="text-center text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600 hover:underline">
            กลับหน้าหลัก
          </Link>
        </p>
      </div>
    </div>
  )
}
