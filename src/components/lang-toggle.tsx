'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'

interface LangToggleProps {
  currentLang: string
}

export default function LangToggle({ currentLang }: LangToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track active lang locally so the button highlights immediately on click
  // without waiting for the server component to re-render
  const [activeLang, setActiveLang] = useState(currentLang)

  // Sync with server-provided prop when navigation completes
  useEffect(() => {
    setActiveLang(currentLang)
  }, [currentLang])

  const switchLang = useCallback(
    (lang: string) => {
      setActiveLang(lang) // instant highlight
      const params = new URLSearchParams(searchParams.toString())
      params.set('lang', lang)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
      <button
        onClick={() => switchLang('th')}
        className={`px-2.5 py-1 rounded-md transition-all ${
          activeLang === 'th'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        TH
      </button>
      <button
        onClick={() => switchLang('en')}
        className={`px-2.5 py-1 rounded-md transition-all ${
          activeLang === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  )
}
