import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getOrCreateDefaultLibrary } from "@/data/libraries"
import { createVisit, listVisitsByHostId } from "@/data/visits"

export async function GET() {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const visits = await listVisitsByHostId(session.user.id)
    return NextResponse.json({ visits })
  } catch {
    return new NextResponse("Failed to list visits", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json().catch(() => null)
    const scheduled_at = typeof body?.scheduled_at === "string" ? body.scheduled_at : ""
    const max_participants =
      typeof body?.max_participants === "number" ? body.max_participants : undefined

    if (!scheduled_at) {
      return new NextResponse("scheduled_at is required", { status: 400 })
    }

    const lib = await getOrCreateDefaultLibrary(session.user.id)
    const visit = await createVisit({
      libraryId: lib.id,
      hostId: session.user.id,
      scheduledAt: scheduled_at,
      maxParticipants: max_participants,
    })
    return NextResponse.json({ visit })
  } catch {
    return new NextResponse("Failed to create visit", { status: 500 })
  }
}

