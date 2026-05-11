'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface BookmarkButtonProps {
  courseId: string
  initialBookmarked: boolean
  isLoggedIn: boolean
}

export default function BookmarkButton({
  courseId,
  initialBookmarked,
  isLoggedIn,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn) return null

  const handleClick = async () => {
    if (loading) return

    // Optimistic update
    const prevBookmarked = bookmarked
    setBookmarked(!bookmarked)
    setLoading(true)

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })

      if (!res.ok) {
        throw new Error('Failed to toggle bookmark')
      }

      const data = await res.json()
      setBookmarked(data.bookmarked)
    } catch {
      // Revert on error
      setBookmarked(prevBookmarked)
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`text-xl transition-colors ${
        bookmarked
          ? 'text-yellow-500 hover:text-yellow-600'
          : 'text-gray-300 hover:text-yellow-400'
      } disabled:opacity-50`}
      aria-label={bookmarked ? 'ยกเลิกบันทึกวิชา' : 'บันทึกวิชา'}
      aria-pressed={bookmarked}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  )
}
