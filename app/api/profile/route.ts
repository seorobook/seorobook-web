import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getProfileById } from "@/data/profiles"

export async function GET() {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const profile = await getProfileById(session.user.id)
    if (!profile) {
      return NextResponse.json({ nickname: null, skin: null })
    }

    return NextResponse.json({
      nickname: profile.nickname ?? null,
      skin: profile.skin ?? null,
    })
  } catch {
    return new NextResponse("Failed to get profile", { status: 500 })
  }
}
