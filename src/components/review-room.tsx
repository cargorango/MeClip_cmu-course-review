'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    displayName: string
    reviewerLevel: string | null
  }
}

interface ReviewRoomProps {
  courseId: string
  isLoggedIn: boolean
}

const LEVEL_COLORS: Record<string, string> = {
  'น้องใหม่': 'bg-green-100 text-green-700',
  'มีประสบการณ์': 'bg-blue-100 text-blue-700',
  'ตำนานมหาลัย': 'bg-purple-100 text-purple-700',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReviewRoom({ courseId, isLoggedIn }: ReviewRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [connected, setConnected] = useState(true)
  const [reconnecting, setReconnecting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectAttempts = useRef(0)

  const fetchMessages = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ courseId, limit: '50' })
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`/api/messages?${params.toString()}`)
    if (!res.ok) throw new Error('fetch failed')
    return res.json() as Promise<{ messages: Message[]; nextCursor: string | null }>
  }, [courseId])

  // Initial load
  useEffect(() => {
    fetchMessages().then(data => {
      setMessages(data.messages)
      setNextCursor(data.nextCursor)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }).catch(() => {})
  }, [fetchMessages])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel(`review-room-${courseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message', filter: `roomId=eq.${courseId}` },
        () => {
          // Refetch latest messages on new insert
          fetchMessages().then(data => {
            setMessages(data.messages)
            setNextCursor(data.nextCursor)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
          }).catch(() => {})
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          setReconnecting(false)
          reconnectAttempts.current = 0
          // Clear polling fallback if connected
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnected(false)
          startPollingFallback()
        } else if (status === 'CLOSED') {
          setConnected(false)
          handleReconnect(channel)
        }
      })

    function startPollingFallback() {
      if (pollingRef.current) return
      pollingRef.current = setInterval(() => {
        fetchMessages().then(data => {
          setMessages(data.messages)
          setNextCursor(data.nextCursor)
        }).catch(() => {})
      }, 5000)
    }

    function handleReconnect(ch: typeof channel) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      reconnectAttempts.current++
      setReconnecting(true)
      setTimeout(() => {
        supabase.removeChannel(ch)
        // Re-subscribe by re-running effect (via state change)
        setReconnecting(false)
      }, delay)
    }

    return () => {
      supabase.removeChannel(channel)
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [courseId, fetchMessages])

  // Load more (pagination)
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchMessages(nextCursor)
      setMessages(prev => [...data.messages, ...prev])
      setNextCursor(data.nextCursor)
    } catch {
      // ignore
    } finally {
      setLoadingMore(false)
    }
  }

  // Intersection observer for scroll-to-top pagination
  useEffect(() => {
    if (!topRef.current || !nextCursor) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(topRef.current)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, content: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        // Refresh messages
        const data = await fetchMessages()
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        const data = await res.json()
        setSendError(data.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch {
      setSendError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Connection status */}
      {(!connected || reconnecting) && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-700 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          กำลังเชื่อมต่อใหม่...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Load more trigger */}
        <div ref={topRef} className="h-1" />
        {loadingMore && (
          <div className="text-center py-2">
            <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
          </div>
        )}
        {nextCursor && !loadingMore && (
          <button
            onClick={loadMore}
            className="w-full text-xs text-blue-600 hover:underline py-1"
          >
            โหลดข้อความก่อนหน้า
          </button>
        )}

        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">ยังไม่มีข้อความ</p>
            <p className="text-xs mt-1">เป็นคนแรกที่รีวิววิชานี้!</p>
          </div>
        )}

        {[...messages].reverse().map(msg => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">
                {msg.sender.displayName}
              </span>
              {msg.sender.reviewerLevel && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[msg.sender.reviewerLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                  {msg.sender.reviewerLevel}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{formatTime(msg.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              {msg.content}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        {!isLoggedIn ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              <a href="/login" className="text-blue-600 hover:underline font-medium">เข้าสู่ระบบ</a>{' '}
              เพื่อร่วมพูดคุยในห้องรีวิว
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        )}
        {sendError && (
          <p className="text-xs text-red-600 mt-1">{sendError}</p>
        )}
      </div>
    </div>
  )
}
