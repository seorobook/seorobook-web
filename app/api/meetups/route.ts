import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ensureProfile } from "@/data/profiles"
import { createMeetup, getActiveMeetupForHost } from "@/data/meetups"

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json().catch(() => null)
    const title = typeof body?.title === "string" ? body.title : ""
    const scheduled_at = typeof body?.scheduled_at === "string" ? body.scheduled_at : null

    await ensureProfile({
      id: session.user.id,
      kind: "member",
      nickname: session.user.email?.split("@")[0] ?? "사용자",
    })

    const existing = await getActiveMeetupForHost(session.user.id)
    if (existing) {
      return NextResponse.json({ meetup: existing })
    }

    const meetup = await createMeetup({
      hostId: session.user.id,
      title,
      scheduledAt: scheduled_at,
    })

    return NextResponse.json({ meetup })
  } catch {
    return new NextResponse("Failed to create meetup", { status: 500 })
  }
}

