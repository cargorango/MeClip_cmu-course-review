'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface LangToggleProps {
  currentLang: string
}

export default function LangToggle({ currentLang }: LangToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const switchLang = useCallback(
    (lang: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('lang', lang)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
      <button
        onClick={() => switchLang('th')}
        className={`px-2.5 py-1 rounded-md transition-all ${
          currentLang === 'th'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        TH
      </button>
      <button
        onClick={() => switchLang('en')}
        className={`px-2.5 py-1 rounded-md transition-all ${
          currentLang === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  )
}
