import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getVisitById, upsertVisitInvitee } from "@/data/visits"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params
    const visit = await getVisitById(id)
    if (!visit) return new NextResponse("Not found", { status: 404 })
    if (visit.host_id !== session.user.id) return new NextResponse("Forbidden", { status: 403 })

    const body = await request.json().catch(() => null)
    const userId = typeof body?.user_id === "string" ? body.user_id : ""
    const message = typeof body?.message === "string" ? body.message : null
    if (!userId) return new NextResponse("user_id is required", { status: 400 })

    const invitee = await upsertVisitInvitee({ visitId: id, userId, message })
    return NextResponse.json({ invitee })
  } catch {
    return new NextResponse("Failed to invite user", { status: 500 })
  }
}

