'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = { current: null as ReturnType<typeof setTimeout> | null }

  const start = useCallback(() => {
    setVisible(true)
    setProgress(20)
    // Simulate progress
    const tick = () => {
      setProgress(p => {
        if (p >= 80) return p
        return p + Math.random() * 15
      })
    }
    timerRef.current = setInterval(tick, 200)
  }, [])

  const done = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(100)
    setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)
  }, [])

  useEffect(() => {
    done()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Listen for link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      start()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [start])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-0.5 bg-blue-500 transition-all duration-200 ease-out"
      style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
    />
  )
}
