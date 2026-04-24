import { NextResponse } from "next/server"
import { getSession } from "@/lib/server-session"
import { getMeetupById, updateMeetupStatus } from "@/data/meetups"

export const runtime = "nodejs"

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request)
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await context.params
    const meetup = await getMeetupById(id)
    if (!meetup) return new NextResponse("Not found", { status: 404 })
    if (meetup.host_id !== session.user.id) return new NextResponse("Forbidden", { status: 403 })

    const body = await request.json().catch(() => null)
    const status = typeof body?.status === "string" ? body.status : ""
    if (!["waiting", "reading", "discussion", "ended", "cancelled"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const updated = await updateMeetupStatus({ meetupId: id, status: status as any })
    return NextResponse.json({ meetup: updated })
  } catch {
    return new NextResponse("Failed to update status", { status: 500 })
  }
}

