'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import BasicButton from '@/components/BasicButton'

const BooksList = dynamic(() => import('@/app/app/books/BooksList'), { ssr: false })

type BooksOverlayProps = {
  isOwner: boolean
  onClose: () => void
}

export default function BooksOverlay({ isOwner, onClose }: BooksOverlayProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="닫기"
      />
      <div
        className="relative bg-secondary rounded-xl shadow-xl max-h-[85vh] w-full max-w-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-primary/20 bg-secondary z-10">
          <h2 className="text-xl font-semibold">독서 기록</h2>
          <BasicButton type="button" onClick={onClose}>
            닫기
          </BasicButton>
        </div>
        <div className="p-4">
          {isOwner ? (
            <BooksList embedded />
          ) : (
            <p className="text-secondary text-center py-8">
              이 서재 주인의 독서 기록은 주인만 볼 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
