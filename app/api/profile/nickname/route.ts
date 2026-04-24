import { NextResponse } from "next/server"
import { getSession } from "@/lib/server-session"
import { updateProfileNickname } from "@/data/profiles"

export async function PATCH(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const nickname = typeof body?.nickname === "string" ? body.nickname : ""
    const value = nickname.trim()
    if (value.length < 2 || value.length > 12) {
      return new NextResponse("nickname must be 2-12 characters", { status: 400 })
    }

    await updateProfileNickname(session.user.id, value)

    return NextResponse.json({ ok: true })
  } catch {
    return new NextResponse("Failed to update nickname", { status: 500 })
  }
}
