import { NextResponse } from "next/server"
import { getSession } from "@/lib/server-session"
import { searchCatalogBooks } from "@/data/catalogBooks"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() || ""
    if (!q) return NextResponse.json({ items: [] })

    const items = await searchCatalogBooks({ q, limit: 20 })
    return NextResponse.json({ items })
  } catch {
    return new NextResponse("Failed to search books", { status: 500 })
  }
}

