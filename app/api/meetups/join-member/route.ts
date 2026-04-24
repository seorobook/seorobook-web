import { NextResponse } from "next/server"
import { getSession } from "@/lib/server-session"
import { ensureProfile } from "@/data/profiles"
import { addMember, getMeetupByInviteCode } from "@/data/meetups"

export const runtime = "nodejs"

function isInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code)
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json().catch(() => null)
    const invite_code = typeof body?.invite_code === "string" ? body.invite_code : ""
    const code = invite_code.trim().toUpperCase()
    if (!code) return NextResponse.json({ error: "invite_code is required" }, { status: 400 })
    if (!isInviteCode(code)) return NextResponse.json({ error: "invalid invite_code" }, { status: 400 })

    const meetup = await getMeetupByInviteCode(code)
    if (!meetup) return NextResponse.json({ error: "Meetup not found" }, { status: 404 })

    if (meetup.status === "ended" || meetup.status === "cancelled") {
      return NextResponse.json({ error: "Invite closed" }, { status: 403 })
    }

    await ensureProfile({
      id: session.user.id,
      kind: "member",
      nickname: session.user.name || session.user.email?.split("@")[0] || "사용자",
    })

    const member = await addMember({
      meetupId: meetup.id,
      userId: session.user.id,
      role: "member",
    })

    return NextResponse.json({
      meetupId: meetup.id,
      memberId: member.id,
      userId: session.user.id,
    })
  } catch {
    return NextResponse.json({ error: "Failed to join meetup" }, { status: 500 })
  }
}
