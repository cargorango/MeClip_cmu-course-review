'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, ChevronDown, Shield } from 'lucide-react'

interface UserMenuProps {
  displayName: string
  isAdmin: boolean
  lang?: string
}

export default function UserMenu({ displayName, isAdmin, lang = 'th' }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
      >
        {displayName}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <Link
            href={`/profile?lang=${lang}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-400" />
            ตั้งค่าบัญชี
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <Shield className="w-4 h-4 text-orange-500" />
              ระบบ Admin
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
