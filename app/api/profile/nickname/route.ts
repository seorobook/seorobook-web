import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateProfileNickname } from "@/data/profiles"

export async function PATCH(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const nickname = typeof body?.nickname === "string" ? body.nickname : null

    await updateProfileNickname(session.user.id, nickname)

    return NextResponse.json({ ok: true })
  } catch {
    return new NextResponse("Failed to update nickname", { status: 500 })
  }
}
