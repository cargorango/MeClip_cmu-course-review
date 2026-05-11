'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface LikeButtonProps {
  messageId: string
  initialCount: number
  initialLiked: boolean
  isLoggedIn: boolean
}

export default function LikeButton({
  messageId,
  initialCount,
  initialLiked,
  isLoggedIn,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!isLoggedIn || loading) return

    // Optimistic update
    const prevLiked = liked
    const prevCount = count
    setLiked(!liked)
    setCount((c) => (liked ? c - 1 : c + 1))
    setLoading(true)

    try {
      const res = await fetch('/api/messages/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })

      if (!res.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await res.json()
      // Update with server response
      setLiked(data.liked)
      setCount(data.count)
    } catch {
      // Revert on error
      setLiked(prevLiked)
      setCount(prevCount)
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isLoggedIn || loading}
      className={`flex items-center gap-1 text-xs transition-colors ${
        isLoggedIn
          ? liked
            ? 'text-red-500 hover:text-red-600'
            : 'text-gray-400 hover:text-red-500'
          : 'text-gray-300 cursor-not-allowed'
      }`}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <Heart
        className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`}
      />
      <span className="font-medium">{count}</span>
    </button>
  )
}
