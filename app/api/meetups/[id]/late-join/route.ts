import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ensureProfile } from "@/data/profiles"
import { addMember, getMeetupById } from "@/data/meetups"

function generateGuestId(): string {
  return `guest_${crypto.randomUUID()}`
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await context.params
    const meetup = await getMeetupById(id)
    if (!meetup) return new NextResponse("Not found", { status: 404 })
    if (meetup.host_id !== session.user.id) return new NextResponse("Forbidden", { status: 403 })

    const body = await request.json().catch(() => null)
    const nickname = typeof body?.nickname === "string" ? body.nickname : ""
    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
      return new NextResponse("nickname must be 2-12 characters", { status: 400 })
    }

    // Domain status is waiting | reading | discussion | ended | cancelled (no "live").
    if (meetup.status !== "reading" && meetup.status !== "discussion") {
      return new NextResponse("Late join only allowed while meetup is in progress", { status: 403 })
    }

    const guestId = generateGuestId()
    await ensureProfile({ id: guestId, kind: "guest", nickname: trimmedNickname })
    const member = await addMember({ meetupId: id, userId: guestId, role: "guest" })

    return NextResponse.json({ guestId, memberId: member.id })
  } catch {
    return new NextResponse("Failed to late join", { status: 500 })
  }
}

