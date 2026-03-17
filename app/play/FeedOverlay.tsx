'use client'

import React, { useEffect, useMemo, useState } from 'react'
import BasicButton from '@/components/BasicButton'

type FeedItem = {
  review_id: string
  book_id: string
  book_title: string
  book_author: string | null
  content: string
  visibility: 'private' | 'public' | 'sero'
  created_at: string
}

type FeedOverlayProps = {
  ownerUserId: string
  isOwner: boolean
  onClose: () => void
}

export default function FeedOverlay({ ownerUserId, isOwner, onClose }: FeedOverlayProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<FeedItem[]>([])

  const title = useMemo(() => (isOwner ? '내 메일함(피드)' : '메일함(피드)'), [isOwner])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/feed?userId=${encodeURIComponent(ownerUserId)}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setItems(data.items ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [ownerUserId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} role="button" tabIndex={0} aria-label="닫기" />
      <div
        className="relative bg-secondary rounded-xl shadow-xl max-h-[85vh] w-full max-w-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-primary/20 bg-secondary z-10">
          <h2 className="text-xl font-semibold">{title}</h2>
          <BasicButton type="button" onClick={onClose}>
            닫기
          </BasicButton>
        </div>

        <div className="p-4">
          {!isOwner && (
            <p className="text-sm text-secondary mb-4">
              현재는 공개(visibility=public)로 설정된 감상만 노출돼요.
            </p>
          )}

          {loading ? (
            <p className="text-secondary">불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="text-secondary">아직 보여줄 피드가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li key={it.review_id} className="border border-secondary rounded-lg p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{it.book_title}</p>
                      {it.book_author && <p className="text-sm text-secondary">{it.book_author}</p>}
                    </div>
                    <span className="text-xs text-secondary whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{it.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

