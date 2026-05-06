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
  const [initialLoading, setInitialLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [connected, setConnected] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectAttempts = useRef(0)
  const messagesRef = useRef<Message[]>([])

  // Keep ref in sync for use inside callbacks
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const fetchMessages = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ courseId, limit: '50' })
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`/api/messages?${params.toString()}`)
    if (!res.ok) throw new Error('fetch failed')
    return res.json() as Promise<{ messages: Message[]; nextCursor: string | null }>
  }, [courseId])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [])

  // Initial load
  useEffect(() => {
    setInitialLoading(true)
    fetchMessages()
      .then(data => {
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        scrollToBottom()
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [fetchMessages, scrollToBottom])

  // Supabase Realtime — append new messages without full refetch
  useEffect(() => {
    const supabase = getSupabaseClient()

    const startPolling = () => {
      if (pollingRef.current) return
      pollingRef.current = setInterval(() => {
        fetchMessages()
          .then(data => {
            setMessages(data.messages)
            setNextCursor(data.nextCursor)
          })
          .catch(() => {})
      }, 5000)
    }

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    const channel = supabase
      .channel(`room-${courseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_payload) => {
          // Refetch latest messages to get formatted sender info
          fetchMessages()
            .then(data => {
              setMessages(data.messages)
              setNextCursor(data.nextCursor)
              scrollToBottom()
            })
            .catch(() => {})
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          reconnectAttempts.current = 0
          stopPolling()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnected(false)
          startPolling()
        }
      })

    return () => {
      supabase.removeChannel(channel)
      stopPolling()
    }
  }, [courseId, fetchMessages, scrollToBottom])

  // Load more (scroll up pagination)
  const loadMore = useCallback(async () => {
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
  }, [nextCursor, loadingMore, fetchMessages])

  // Intersection observer for auto-load on scroll up
  useEffect(() => {
    if (!topRef.current || !nextCursor) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(topRef.current)
    return () => observer.disconnect()
  }, [nextCursor, loadMore])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setSending(true)
    setSendError('')

    // Optimistic UI — add temp message immediately
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      sender: { displayName: 'คุณ', reviewerLevel: null },
    }
    setMessages(prev => [...prev, tempMsg])
    setInput('')
    scrollToBottom()

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, content: trimmed }),
      })

      if (res.ok) {
        // Replace temp message with real data from server
        const data = await fetchMessages()
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        scrollToBottom()
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(trimmed)
        const data = await res.json()
        setSendError(data.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(trimmed)
      setSendError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Connection status */}
      {!connected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-700 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          ใช้ polling แทน realtime (เชื่อมต่อใหม่อัตโนมัติ)
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div ref={topRef} className="h-1" />

        {loadingMore && (
          <div className="text-center py-2">
            <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
          </div>
        )}

        {nextCursor && !loadingMore && (
          <button
            onClick={loadMore}
            className="w-full text-xs text-blue-600 hover:underline py-1 transition-colors"
          >
            โหลดข้อความก่อนหน้า
          </button>
        )}

        {initialLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">ยังไม่มีข้อความ</p>
            <p className="text-xs mt-1">เป็นคนแรกที่รีวิววิชานี้!</p>
          </div>
        ) : (
          [...messages].reverse().map(msg => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className={`text-sm text-gray-700 rounded-lg px-3 py-2 leading-relaxed ${msg.id.startsWith('temp-') ? 'bg-blue-50 opacity-70' : 'bg-gray-50'}`}>
                {msg.content}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        {!isLoggedIn ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                เข้าสู่ระบบ
              </a>{' '}
              เพื่อร่วมพูดคุยในห้องรีวิว
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setSendError('') }}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความ... (Enter เพื่อส่ง)"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              disabled={sending}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
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
          <p className="text-xs text-red-600 mt-1.5">{sendError}</p>
        )}
      </div>
    </div>
  )
}
