import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  cleanupExpiredGuests,
  getMeetupById,
  listMembersWithBooks,
  removeGuestFromMeetup,
  removeMemberFromMeetup,
} from "@/data/meetups"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Minimal TTL enforcement (best-effort, cheap enough for MVP)
    await cleanupExpiredGuests().catch(() => null)

    const { id } = await context.params
    const meetup = await getMeetupById(id)
    if (!meetup) return new NextResponse("Not found", { status: 404 })

    const members = await listMembersWithBooks(id)
    return NextResponse.json({ meetup, members })
  } catch {
    return new NextResponse("Failed to load meetup", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    // Guest leave (web): x-seoro-guest-id
    const guestId = request.headers.get("x-seoro-guest-id") || ""
    if (guestId.startsWith("guest_")) {
      const removed = await removeGuestFromMeetup({ meetupId: id, guestId })
      return new NextResponse(null, { status: removed ? 204 : 404 })
    }

    // Member leave (app): Neon Auth session
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const removed = await removeMemberFromMeetup({ meetupId: id, userId: session.user.id })
    return new NextResponse(null, { status: removed ? 204 : 404 })
  } catch {
    return new NextResponse("Failed to leave meetup", { status: 500 })
  }
}

