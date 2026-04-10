"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

const GUEST_KEY = "seorobook_guest_id"

export default function MeetGuestJoinPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const code = inviteCode.trim().toUpperCase()
      const nick = nickname.trim()
      if (!code) {
        setError("초대코드를 입력해 주세요.")
        return
      }
      if (nick.length < 2 || nick.length > 12) {
        setError("닉네임은 2~12자로 입력해 주세요.")
        return
      }

      const res = await fetch("/api/meetups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code, nickname: nick }),
      })
      const text = await res.text()
      if (!res.ok) {
        setError(text || `오류 (${res.status})`)
        return
      }
      const data = JSON.parse(text) as { meetupId: string; guestId: string }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(GUEST_KEY, data.guestId)
      }
      router.push(`/meet/${data.meetupId}/room`)
    } catch {
      setError("참가 요청에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">모임 참가 (게스트)</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#555555]">
        앱 설치 없이 웹에서만 게스트로 참가합니다. 회원 전용 기능은 모바일 앱에서 로그인 후 이용해 주세요.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#E8E8E0] bg-white p-5">
        <label className="text-xs font-semibold text-[#1A1A1A]">
          초대코드
          <input
            className="mt-1 w-full rounded-xl border border-[#E8E8E0] bg-[#F7F7F2] px-3 py-2.5 text-base text-[#1A1A1A]"
            value={inviteCode}
            onChange={(ev) => setInviteCode(ev.target.value)}
            autoCapitalize="characters"
            placeholder="예: ABCD1234"
          />
        </label>
        <label className="text-xs font-semibold text-[#1A1A1A]">
          닉네임 (2~12자)
          <input
            className="mt-1 w-full rounded-xl border border-[#E8E8E0] bg-[#F7F7F2] px-3 py-2.5 text-base text-[#1A1A1A]"
            value={nickname}
            onChange={(ev) => setNickname(ev.target.value)}
            placeholder="방에서 보일 이름"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#1E3A2F] py-3 text-center font-bold text-white disabled:opacity-60">
          {loading ? "참가 중…" : "참가하기"}
        </button>
      </form>
    </div>
  )
}
