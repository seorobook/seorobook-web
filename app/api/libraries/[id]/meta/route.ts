import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateLibraryMeta } from "@/data/libraries"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const meta: {
      name?: string
      only_owner?: boolean
      share_id?: string | null
    } = {}

    if (typeof body.name === "string") {
      meta.name = body.name.trim()
    }

    if (typeof body.only_owner === "boolean") {
      meta.only_owner = body.only_owner
    }

    if (body.share_id === null || typeof body.share_id === "string") {
      meta.share_id = body.share_id
    }

    await updateLibraryMeta(id, session.user.id, meta)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return new NextResponse("Failed to update library", { status: 500 })
  }
}
