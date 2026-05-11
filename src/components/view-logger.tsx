'use client'

import { useEffect } from 'react'

export default function ViewLogger({ courseId }: { courseId: string }) {
  useEffect(() => {
    fetch('/api/logs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    }).catch(() => {})
  }, [courseId])
  return null
}
