'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import BasicButton from '@/components/BasicButton'
import BasicInput from '@/components/BasicInput'

type Book = {
  id: string
  title: string
  author: string | null
  read_at: string | null
  created_at: string
}

type Review = {
  id: string
  content: string
  visibility: string
  created_at: string
}

type BooksListProps = {
  /** 오버레이 등에 임베드 시 true면 "서재 목록" 링크 숨김 */
  embedded?: boolean
}

export default function BooksList({ embedded }: BooksListProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddBook, setShowAddBook] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addAuthor, setAddAuthor] = useState('')
  const [addReadAt, setAddReadAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)
  const [reviewsByBook, setReviewsByBook] = useState<Record<string, Review[]>>({})
  const [newReviewContent, setNewReviewContent] = useState<Record<string, string>>({})
  const [newReviewVisibility, setNewReviewVisibility] = useState<Record<string, 'private' | 'public'>>({})
  const [reviewSubmitting, setReviewSubmitting] = useState<string | null>(null)

  async function loadBooks() {
    try {
      const res = await fetch('/api/books', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setBooks(data.books ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadReviews(bookId: string) {
    const res = await fetch(`/api/books/${bookId}/reviews`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    setReviewsByBook((prev) => ({ ...prev, [bookId]: data.reviews ?? [] }))
  }

  useEffect(() => {
    if (expandedBookId) {
      loadReviews(expandedBookId)
    }
  }, [expandedBookId])

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault()
    if (!addTitle.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addTitle.trim(),
          author: addAuthor.trim() || null,
          read_at: addReadAt || null,
        }),
      })
      if (res.ok) {
        setAddTitle('')
        setAddAuthor('')
        setAddReadAt('')
        setShowAddBook(false)
        await loadBooks()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddReview(bookId: string) {
    const content = (newReviewContent[bookId] ?? '').trim()
    if (!content || reviewSubmitting) return
    const visibility = newReviewVisibility[bookId] ?? 'private'
    setReviewSubmitting(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, visibility }),
      })
      if (res.ok) {
        setNewReviewContent((prev) => ({ ...prev, [bookId]: '' }))
        await loadReviews(bookId)
      }
    } finally {
      setReviewSubmitting(null)
    }
  }

  if (loading) {
    return <p className="text-secondary">불러오는 중...</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <div className="flex items-center gap-2">
          <Link href="/app" className="text-sm text-secondary hover:underline">
            ← 서재 목록
          </Link>
        </div>
      )}

      {!showAddBook ? (
        <BasicButton onClick={() => setShowAddBook(true)} className="w-fit">
          + 읽은 책 추가
        </BasicButton>
      ) : (
        <form onSubmit={handleAddBook} className="flex flex-col gap-2 p-3 bg-secondary rounded-lg">
          <BasicInput
            label="제목"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
          />
          <BasicInput
            label="저자 (선택)"
            value={addAuthor}
            onChange={(e) => setAddAuthor(e.target.value)}
          />
          <div>
            <label className="block text-sm mb-1">읽은 날 (선택)</label>
            <input
              type="date"
              className="w-full bg-primary rounded px-2 py-1 border border-secondary"
              value={addReadAt}
              onChange={(e) => setAddReadAt(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <BasicButton type="submit" disabled={submitting || !addTitle.trim()}>
              {submitting ? '저장 중...' : '추가'}
            </BasicButton>
            <BasicButton type="button" onClick={() => setShowAddBook(false)}>
              취소
            </BasicButton>
          </div>
        </form>
      )}

      <ul className="flex flex-col gap-3">
        {books.length === 0 && (
          <li className="text-secondary text-sm">아직 추가한 책이 없습니다.</li>
        )}
        {books.map((book) => (
          <li key={book.id} className="border border-secondary rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{book.title}</p>
                {book.author && (
                  <p className="text-sm text-secondary">{book.author}</p>
                )}
                {book.read_at && (
                  <p className="text-xs text-secondary">읽은 날: {book.read_at}</p>
                )}
              </div>
              <button
                type="button"
                className="text-sm text-secondary hover:underline"
                onClick={() =>
                  setExpandedBookId((id) => (id === book.id ? null : book.id))
                }
              >
                {expandedBookId === book.id ? '접기' : '감상 보기'}
              </button>
            </div>
            {expandedBookId === book.id && (
              <div className="mt-3 pt-3 border-t border-secondary">
                <p className="text-sm font-medium mb-2">감상/리뷰</p>
                {(reviewsByBook[book.id] ?? []).length === 0 ? (
                  <p className="text-sm text-secondary">아직 감상이 없습니다.</p>
                ) : (
                  <ul className="flex flex-col gap-2 mb-3">
                    {(reviewsByBook[book.id] ?? []).map((r) => (
                      <li
                        key={r.id}
                        className="text-sm bg-primary/50 rounded p-2 whitespace-pre-wrap"
                      >
                        <span className="text-xs text-secondary mr-2">
                          {r.visibility === 'public' ? '공개' : '비공개'}
                        </span>
                        {r.content}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm text-secondary">공개 설정:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`visibility-${book.id}`}
                      checked={(newReviewVisibility[book.id] ?? 'private') === 'private'}
                      onChange={() =>
                        setNewReviewVisibility((prev) => ({ ...prev, [book.id]: 'private' }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">비공개</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`visibility-${book.id}`}
                      checked={(newReviewVisibility[book.id] ?? 'private') === 'public'}
                      onChange={() =>
                        setNewReviewVisibility((prev) => ({ ...prev, [book.id]: 'public' }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">공개</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-primary rounded px-2 py-1 text-sm border border-secondary"
                    placeholder="감상 적기..."
                    value={newReviewContent[book.id] ?? ''}
                    onChange={(e) =>
                      setNewReviewContent((prev) => ({
                        ...prev,
                        [book.id]: e.target.value,
                      }))
                    }
                  />
                  <BasicButton
                    type="button"
                    disabled={
                      reviewSubmitting !== null ||
                      !(newReviewContent[book.id] ?? '').trim()
                    }
                    onClick={() => handleAddReview(book.id)}
                  >
                    {reviewSubmitting === book.id ? '저장 중...' : '저장'}
                  </BasicButton>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
