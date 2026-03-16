import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateProfileSkin } from "@/data/profiles"

export async function PATCH(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const skin = body?.skin

    if (typeof skin !== "string" || !skin.trim()) {
      return new NextResponse("Invalid skin", { status: 400 })
    }

    await updateProfileSkin(session.user.id, skin)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return new NextResponse("Failed to update skin", { status: 500 })
  }
}

