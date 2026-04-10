import { NextResponse } from "next/server"
import { ensureProfile } from "@/data/profiles"
import { addMember, getMeetupByInviteCode } from "@/data/meetups"

function generateGuestId(): string {
  return `guest_${crypto.randomUUID()}`
}

function isInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const invite_code = typeof body?.invite_code === "string" ? body.invite_code : ""
    const nickname = typeof body?.nickname === "string" ? body.nickname : ""

    const code = invite_code.trim().toUpperCase()
    if (!code) return NextResponse.json({ error: "invite_code is required" }, { status: 400 })
    if (!isInviteCode(code)) return NextResponse.json({ error: "invalid invite_code" }, { status: 400 })

    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      return NextResponse.json({ error: "nickname must be 2-12 characters" }, { status: 400 })
    }

    const meetup = await getMeetupByInviteCode(code)
    if (!meetup) return NextResponse.json({ error: "Meetup not found" }, { status: 404 })

    if (meetup.status === "ended" || meetup.status === "cancelled") {
      return NextResponse.json({ error: "Invite closed" }, { status: 403 })
    }

    const guestId = generateGuestId()

    await ensureProfile({
      id: guestId,
      kind: "guest",
      nickname: trimmedNickname,
    })

    const member = await addMember({
      meetupId: meetup.id,
      userId: guestId,
      role: "guest",
    })

    return NextResponse.json({ meetupId: meetup.id, guestId, memberId: member.id })
  } catch {
    return NextResponse.json({ error: "Failed to join meetup" }, { status: 500 })
  }
}

