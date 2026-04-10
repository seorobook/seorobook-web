"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

const GUEST_KEY = "seorobook_guest_id"

type MeetupStatus = "scheduled" | "live" | "ended" | "cancelled"

type Meetup = {
  id: string
  title: string
  status: MeetupStatus
}

type MeetupMember = {
  member_id: string
  user_id: string
  role: string
  nickname: string
  book_title: string | null
  author: string | null
}

export default function MeetGuestRoomPage() {
  const params = useParams<{ meetupId: string }>()
  const meetupId = params.meetupId

  const [guestId, setGuestId] = useState<string | null>(null)
  const [meetup, setMeetup] = useState<Meetup | null>(null)
  const [members, setMembers] = useState<MeetupMember[]>([])
  const [bookTitle, setBookTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setGuestId(window.localStorage.getItem(GUEST_KEY))
  }, [])

  const fetchSnapshot = useCallback(async () => {
    if (!meetupId) return
    setError(null)
    try {
      const res = await fetch(`/api/meetups/${meetupId}`)
      const text = await res.text()
      if (!res.ok) {
        setError(text || `오류 (${res.status})`)
        return
      }
      const data = JSON.parse(text) as { meetup: Meetup; members: MeetupMember[] }
      setMeetup(data.meetup)
      setMembers(data.members)
    } catch {
      setError("불러오기에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }, [meetupId])

  useEffect(() => {
    fetchSnapshot()
    const t = setInterval(fetchSnapshot, 4000)
    return () => clearInterval(t)
  }, [fetchSnapshot])

  const myMember = useMemo(() => {
    if (!guestId) return null
    return members.find((m) => m.user_id === guestId) ?? null
  }, [guestId, members])

  const onSaveBook = async (e: FormEvent) => {
    e.preventDefault()
    if (!guestId) {
      setError("게스트 정보가 없습니다. /meet/join 에서 다시 참가해 주세요.")
      return
    }
    if (meetup?.status === "ended" || meetup?.status === "cancelled") {
      setError("종료된 모임입니다.")
      return
    }
    const t = bookTitle.trim()
    if (!t) {
      setError("책 제목을 입력해 주세요.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/meetups/${meetupId}/me/book`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-seoro-guest-id": guestId,
        },
        body: JSON.stringify({ book_title: t, author: author.trim() || null }),
      })
      const text = await res.text()
      if (!res.ok) {
        setError(text || `오류 (${res.status})`)
        return
      }
      setBookTitle("")
      setAuthor("")
      await fetchSnapshot()
    } catch {
      setError("저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  if (!meetupId) {
    return <p className="p-6 text-sm text-red-700">잘못된 주소입니다.</p>
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/meet/join" className="text-sm font-semibold text-[#1E3A2F]">
          ← 참가 화면
        </Link>
        <button
          type="button"
          onClick={async () => {
            const gid = guestId || ""
            try {
              if (gid) {
                await fetch(`/api/meetups/${meetupId}`, {
                  method: "DELETE",
                  headers: { "x-seoro-guest-id": gid },
                })
              }
            } catch {
              // ignore
            }
            try {
              window.localStorage.removeItem(GUEST_KEY)
            } catch {
              // ignore
            }
            setGuestId(null)
            window.location.href = "/meet/join"
          }}
          className="rounded-xl border border-[#E8E8E0] bg-white px-3 py-2 text-sm font-bold text-[#C0392B]">
          나가기
        </button>
      </div>
      <h1 className="text-xl font-bold text-[#1A1A1A]">{meetup?.title ?? "Meetup"}</h1>
      <p className="text-sm text-[#666666]">상태: {meetup?.status ?? "…"}</p>

      <p className="mt-4 rounded-xl border border-[#E8E8E0] bg-white p-4 text-sm text-[#555555]">
        보안상 초대코드는 모임장에게만 표시됩니다. 초대코드는 모임장에게 받아{" "}
        <span className="font-semibold">/meet/join</span> 에서 입력해 주세요.
      </p>
      {meetup?.status === "ended" || meetup?.status === "cancelled" ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          모임이 종료되었습니다. 참가하려면 새 초대코드로 다시 입장해 주세요.
        </p>
      ) : null}

      {!guestId ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          이 기기에 게스트 ID가 없습니다.{" "}
          <Link href="/meet/join" className="font-semibold underline">
            참가하기
          </Link>
          에서 다시 입장해 주세요.
        </p>
      ) : null}

      <form onSubmit={onSaveBook} className="mt-6 rounded-2xl border border-[#E8E8E0] bg-white p-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">내가 읽는 책</h2>
        <p className="mt-1 text-xs text-[#666666]">MVP: 제목·작가만 입력</p>
        <input
          className="mt-3 w-full rounded-xl border border-[#E8E8E0] bg-[#F7F7F2] px-3 py-2 text-[#1A1A1A]"
          placeholder="책 제목"
          value={bookTitle}
          onChange={(ev) => setBookTitle(ev.target.value)}
        />
        <input
          className="mt-2 w-full rounded-xl border border-[#E8E8E0] bg-[#F7F7F2] px-3 py-2 text-[#1A1A1A]"
          placeholder="작가 (선택)"
          value={author}
          onChange={(ev) => setAuthor(ev.target.value)}
        />
        <button
          type="submit"
          disabled={saving || !guestId}
          className="mt-3 w-full rounded-xl bg-[#1E3A2F] py-2.5 font-bold text-white disabled:opacity-50">
          {saving ? "저장 중…" : "저장"}
        </button>
        {myMember?.book_title ? (
          <p className="mt-2 text-xs text-[#666666]">
            현재: {myMember.book_title}
            {myMember.author ? ` / ${myMember.author}` : ""}
          </p>
        ) : null}
      </form>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 rounded-2xl border border-[#E8E8E0] bg-white p-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">참여자</h2>
        <p className="text-xs text-[#666666]">약 4초마다 갱신</p>
        {loading ? <p className="mt-3 text-sm text-[#666666]">불러오는 중…</p> : null}
        <ul className="mt-3 space-y-2">
          {members.map((m) => (
            <li key={m.member_id} className="rounded-lg bg-[#F7F7F2] px-3 py-2 text-sm">
              <span className="font-semibold text-[#1A1A1A]">{m.nickname}</span>
              <span className="text-[#888888]"> ({m.role})</span>
              <div className="text-xs text-[#555555]">
                {m.book_title ? `${m.book_title}${m.author ? ` / ${m.author}` : ""}` : "—"}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
