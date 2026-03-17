import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getVisitInvitee, respondToVisitInvite } from "@/data/visits"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params
    const existing = await getVisitInvitee({ visitId: id, userId: session.user.id })
    if (!existing) return new NextResponse("Not found", { status: 404 })

    const body = await request.json().catch(() => null)
    const status = body?.status === "accepted" || body?.status === "rejected" ? body.status : ""
    if (!status) return new NextResponse("status is required", { status: 400 })

    const ok = await respondToVisitInvite({ visitId: id, userId: session.user.id, status })
    return NextResponse.json({ ok })
  } catch {
    return new NextResponse("Failed to respond", { status: 500 })
  }
}

