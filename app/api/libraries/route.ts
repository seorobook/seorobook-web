import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createLibrary, deleteLibrary } from "@/data/libraries"

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

    const library = await createLibrary(session.user.id, name, mapData)

    return NextResponse.json({ library })
  } catch (error: unknown) {
    const pg = error as { code?: string }
    if (pg?.code === "23505") {
      return new NextResponse("You already have a library. One library per account.", { status: 409 })
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("POST /api/libraries", error)
    }
    return new NextResponse("Failed to create library", { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const id = typeof body?.id === "string" ? body.id.trim() : ""

    if (!id) {
      return new NextResponse("id is required", { status: 400 })
    }

    const ok = await deleteLibrary(id, session.user.id)
    if (!ok) {
      return new NextResponse("Not found", { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return new NextResponse("Failed to delete library", { status: 500 })
  }
}
