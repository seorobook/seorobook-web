import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createRealm } from "@/data/realms"

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const mapData = body?.map_data ?? null

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const realm = await createRealm(session.user.id, name, mapData)

    return NextResponse.json({ realm })
  } catch (error) {
    return new NextResponse("Failed to create realm", { status: 500 })
  }
}

