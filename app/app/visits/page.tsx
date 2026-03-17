'use client'

import React, { useEffect, useMemo, useState } from 'react'
import BasicButton from '@/components/BasicButton'

type Visit = {
  id: string
  library_id: string
  host_id: string
  scheduled_at: string
  max_participants: number
  status: string
  created_at: string
}

export default function VisitsPage() {
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<Visit[]>([])
  const [creating, setCreating] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    return d.toISOString().slice(0, 16) // yyyy-mm-ddThh:mm
  })

  const joinBase = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/visits', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setVisits(data.visits ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (creating) return
    setCreating(true)
    try {
      const iso = new Date(scheduledAt).toISOString()
      const res = await fetch('/api/visits', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: iso, max_participants: 2 }),
      })
      if (!res.ok) return
      await load()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="px-6 pb-6 flex flex-col gap-4">

        <div className="border border-secondary rounded-lg p-4 flex flex-col gap-3">
          <div>
            <label className="block text-sm text-secondary mb-1">약속 시간</label>
            <input
              type="datetime-local"
              className="bg-primary rounded px-2 py-1 border border-secondary"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <BasicButton type="button" onClick={create} disabled={creating}>
            {creating ? '생성 중...' : '방문 세션 생성'}
          </BasicButton>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">내 방문 세션</h2>
          {loading ? (
            <p className="text-secondary">불러오는 중...</p>
          ) : visits.length === 0 ? (
            <p className="text-secondary">아직 방문 세션이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visits.map((v) => {
                const href = `/visit/${v.id}`
                const full = joinBase ? `${joinBase}${href}` : href
                return (
                  <li
                    key={v.id}
                    className="border border-secondary rounded-lg p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-secondary">
                          {new Date(v.scheduled_at).toLocaleString()} · {v.status}
                        </p>
                        <p className="text-xs text-secondary">max: {v.max_participants}</p>
                      </div>
                      <a href={href} className="text-sm hover:underline whitespace-nowrap">
                        입장 →
                      </a>
                    </div>
                    <p className="text-xs text-secondary break-all">{full}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
    </div>
  )
}

