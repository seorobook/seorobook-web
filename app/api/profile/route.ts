import { NextResponse } from "next/server"
import { getSession } from "@/lib/server-session"
import { getProfileById } from "@/data/profiles"

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const profile = await getProfileById(session.user.id)
    if (!profile) {
      return NextResponse.json({ nickname: null })
    }

    return NextResponse.json({
      nickname: profile.nickname,
    })
  } catch {
    return new NextResponse("Failed to get profile", { status: 500 })
  }
}
