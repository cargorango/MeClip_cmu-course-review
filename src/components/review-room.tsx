'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, Pencil, Check, X, EyeOff, Eye } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { formatStatus } from '@/lib/status-formatter'
import GradeSelector from '@/components/grade-selector'
import LikeButton from '@/components/like-button'

interface Message {
  id: string
  content: string
  grade: string | null
  createdAt: string
  editedAt: string | null
  isOwn: boolean
  likeCount: number
  likedByUser: boolean
  sender: {
    displayName: string
    reviewerLevel: string | null
    statusLabel: string | null
  }
}

interface ReviewRoomProps {
  courseId: string
  isLoggedIn: boolean
}

interface UserProfile {
  status?: string | null
  degreeLevel?: string | null
  yearOfStudy?: number | null
  faculty?: string | null
  alumniYear?: number | null
}

const LEVEL_COLORS: Record<string, string> = {
  'เริ่มรีวิว': 'bg-green-100 text-green-700',
  'มีประสบการณ์': 'bg-blue-100 text-blue-700',
  'ตำนานมหาลัย': 'bg-purple-100 text-purple-700',
}

const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-green-100 text-green-700',
  'B+': 'bg-emerald-100 text-emerald-700',
  'B': 'bg-teal-100 text-teal-700',
  'C+': 'bg-yellow-100 text-yellow-700',
  'C': 'bg-orange-100 text-orange-700',
  'D+': 'bg-red-100 text-red-700',
  'D': 'bg-red-200 text-red-800',
  'F': 'bg-gray-200 text-gray-700',
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

function isWithin24Hours(iso: string): boolean {
  return (Date.now() - new Date(iso).getTime()) < 24 * 60 * 60 * 1000
}

export default function ReviewRoom({ courseId, isLoggedIn }: ReviewRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [input, setInput] = useState('')
  const [grade, setGrade] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [connected, setConnected] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Load anonymous preference and profile data
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        if (typeof d.isAnonymous === 'boolean') setIsAnonymous(d.isAnonymous)
        setUserProfile({
          status: d.status,
          degreeLevel: d.degreeLevel,
          yearOfStudy: d.yearOfStudy,
          faculty: d.faculty,
          alumniYear: d.alumniYear,
        })
      })
      .catch(() => {})
  }, [isLoggedIn])

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

  // Supabase Realtime
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
        () => {
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

  // Load more
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

    const tempId = `temp-${Date.now()}`
    const anonymousPlaceholder = isAnonymous
      ? formatStatus(userProfile)
      : 'คุณ'
    const tempMsg: Message = {
      id: tempId,
      content: trimmed,
      grade: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      isOwn: true,
      likeCount: 0,
      likedByUser: false,
      sender: { displayName: anonymousPlaceholder, reviewerLevel: null, statusLabel: null },
    }
    setMessages(prev => [...prev, tempMsg])
    setInput('')
    const sentGrade = grade
    setGrade(null)
    scrollToBottom()

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, content: trimmed, isAnonymous, grade: sentGrade }),
      })

      if (res.ok) {
        const data = await fetchMessages()
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        scrollToBottom()
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(trimmed)
        setGrade(sentGrade)
        const data = await res.json()
        setSendError(data.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(trimmed)
      setGrade(sentGrade)
      setSendError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSending(false)
    }
  }

  const startEdit = (msg: Message) => {
    setEditingId(msg.id)
    setEditContent(msg.content)
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditError('')
  }

  const handleEdit = async (messageId: string) => {
    const trimmed = editContent.trim()
    if (!trimmed || editLoading) return

    setEditLoading(true)
    setEditError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content: trimmed }),
      })

      if (res.ok) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, content: trimmed, editedAt: new Date().toISOString() }
              : m
          )
        )
        cancelEdit()
      } else {
        const data = await res.json()
        setEditError(data.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch {
      setEditError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setEditLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-[560px]">
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
            <div key={msg.id} className="flex flex-col gap-0.5 group">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">
                  {msg.sender.displayName}
                  {msg.sender.statusLabel && (
                    <span className="text-xs font-normal text-gray-500 ml-1">- {msg.sender.statusLabel}</span>
                  )}
                </span>
                {msg.sender.reviewerLevel && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[msg.sender.reviewerLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                    {msg.sender.reviewerLevel}
                  </span>
                )}
                {/* Grade badge */}
                {msg.grade && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${GRADE_COLORS[msg.grade] ?? 'bg-gray-100 text-gray-600'}`}>
                    เกรด {msg.grade}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{formatTime(msg.createdAt)}</span>
                {msg.editedAt && (
                  <span className="text-xs text-gray-400">(แก้ไขแล้ว)</span>
                )}
                {msg.isOwn && !msg.id.startsWith('temp-') && isWithin24Hours(msg.createdAt) && editingId !== msg.id && (
                  <button
                    onClick={() => startEdit(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
                    title="แก้ไขข้อความ"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              {editingId === msg.id ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEdit(msg.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    maxLength={500}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  {editError && <p className="text-xs text-red-600">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(msg.id)}
                      disabled={editLoading || !editContent.trim()}
                      className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      บันทึก
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className={`text-sm text-gray-700 rounded-lg px-3 py-2 leading-relaxed ${msg.id.startsWith('temp-') ? 'bg-blue-50 opacity-70' : 'bg-gray-50'}`}>
                    {msg.content}
                  </p>
                  {/* Like button — only for real (non-temp) messages */}
                  {!msg.id.startsWith('temp-') && (
                    <div className="mt-1 pl-3">
                      <LikeButton
                        messageId={msg.id}
                        initialCount={msg.likeCount}
                        initialLiked={msg.likedByUser}
                        isLoggedIn={isLoggedIn}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 space-y-2">
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
          <>
            {/* Anonymous toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                {isAnonymous ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {isAnonymous ? 'ส่งแบบไม่ระบุตัวตน (แสดงสถานะแทนชื่อ)' : 'ส่งแบบระบุตัวตน'}
              </span>
              <button
                type="button"
                onClick={() => setIsAnonymous(v => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isAnonymous ? 'bg-gray-600' : 'bg-gray-300'
                }`}
                aria-label="toggle anonymous mode"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isAnonymous ? 'translate-x-[18px]' : 'translate-x-[2px]'
                  }`}
                />
              </button>
            </div>

            {/* Grade selector */}
            <GradeSelector
              value={grade}
              onChange={setGrade}
              label="เกรดที่ได้ (ไม่บังคับ)"
            />

            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); setSendError('') }}
                onKeyDown={handleKeyDown}
                placeholder={isAnonymous ? 'พิมพ์ข้อความ (ไม่ระบุตัวตน)...' : 'พิมพ์ข้อความ... (Enter เพื่อส่ง)'}
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
          </>
        )}
        {sendError && (
          <p className="text-xs text-red-600 mt-1.5">{sendError}</p>
        )}
      </div>
    </div>
  )
}
