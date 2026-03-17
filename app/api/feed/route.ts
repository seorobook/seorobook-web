import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listRecentReviewFeedItems } from "@/data/feed"

export async function GET(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const url = new URL(request.url)
    const ownerUserId = url.searchParams.get("userId") || ""
    if (!ownerUserId) {
      return new NextResponse("userId is required", { status: 400 })
    }

    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Number(limitParam) : undefined

    const items = await listRecentReviewFeedItems({
      ownerUserId,
      viewerUserId: session.user.id,
      limit: Number.isFinite(limit as number) ? (limit as number) : undefined,
    })

    return NextResponse.json({ items })
  } catch {
    return new NextResponse("Failed to load feed", { status: 500 })
  }
}

