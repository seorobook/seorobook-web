import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getVisitById, getVisitInvitee } from "@/data/visits"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params
    const visit = await getVisitById(id)
    if (!visit) return new NextResponse("Not found", { status: 404 })

    const invitee = await getVisitInvitee({ visitId: id, userId: session.user.id })
    const canJoin =
      session.user.id === visit.host_id || invitee?.status === "accepted"

    return NextResponse.json({ visit, invitee, canJoin })
  } catch {
    return new NextResponse("Failed to load visit", { status: 500 })
  }
}

