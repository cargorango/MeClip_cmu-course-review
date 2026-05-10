import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Suspense } from 'react'
import './globals.css'
import NavigationProgress from '@/components/navigation-progress'
import { Toaster } from 'sonner'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'CMU Course Review',
  description: 'รีวิวและค้นหากระบวนวิชาของมหาวิทยาลัยเชียงใหม่',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} antialiased bg-gray-50 text-gray-900`}>
        {/* Navigation progress bar */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster richColors position="top-right" duration={4000} />
      </body>
    </html>
  )
}
