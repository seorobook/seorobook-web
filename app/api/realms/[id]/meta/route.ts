import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateRealmMeta } from "@/data/realms"

type Params = {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

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

    await updateRealmMeta(params.id, session.user.id, meta)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return new NextResponse("Failed to update realm", { status: 500 })
  }
}

