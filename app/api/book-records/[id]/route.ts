import { NextResponse } from "next/server"
import { getSession } from "@/lib/server-session"
import { updateBookRecord, type BookRecordStatus } from "@/data/bookRecords"

export const runtime = "nodejs"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await context.params
    const body = await request.json().catch(() => null)

    const status = typeof body?.status === "string" ? (body.status as BookRecordStatus) : undefined
    const progress_percent = typeof body?.progress_percent === "number" ? body.progress_percent : undefined
    const wishlist = typeof body?.wishlist === "boolean" ? body.wishlist : undefined
    const tags = Array.isArray(body?.tags) ? body.tags : undefined

    const updated = await updateBookRecord({
      id,
      userId: session.user.id,
      status,
      progressPercent: progress_percent,
      wishlist,
      tags,
    })
    if (!updated) return new NextResponse("Not found", { status: 404 })
    return NextResponse.json({ record: updated })
  } catch {
    return new NextResponse("Failed to update record", { status: 500 })
  }
}

