'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Star } from 'lucide-react'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [systemRating, setSystemRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('กรุณากรอกรายละเอียดปัญหา')
      return
    }
    if (systemRating === 0) {
      setError('กรุณาให้คะแนนระบบ')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), systemRating }),
      })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setOpen(false)
          setSubmitted(false)
          setContent('')
          setSystemRating(0)
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Fixed button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
        aria-label="รายงานปัญหา / ให้คะแนนระบบ"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">รายงานปัญหา / ให้คะแนนระบบ</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-green-600 font-medium">ขอบคุณสำหรับความคิดเห็น!</p>
                <p className="text-sm text-gray-500 mt-1">เราจะนำไปปรับปรุงระบบต่อไป</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star rating */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">คะแนนความพึงพอใจ</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSystemRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoverRating || systemRating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text area */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">รายละเอียดปัญหา / ข้อเสนอแนะ</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="กรุณาอธิบายปัญหาหรือข้อเสนอแนะ..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
