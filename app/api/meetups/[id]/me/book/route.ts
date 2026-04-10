import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getMemberId, setMyBook } from "@/data/meetups"

export const runtime = "nodejs"

function getGuestId(request: Request): string | null {
  const raw = request.headers.get("x-seoro-guest-id")
  const id = raw?.trim() || null
  if (!id) return null
  if (!id.startsWith("guest_")) return null
  return id
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: meetupId } = await context.params
    const { data: session } = await auth.getSession()
    const userId = session?.user?.id ?? getGuestId(request)
    if (!userId) return new NextResponse("Auth required", { status: 401 })

    const memberId = await getMemberId({ meetupId, userId })
    if (!memberId) return new NextResponse("Not a member", { status: 403 })

    const body = await request.json().catch(() => null)
    const book_title = typeof body?.book_title === "string" ? body.book_title : ""
    const author = typeof body?.author === "string" ? body.author : null
    const cover_url = typeof body?.cover_url === "string" ? body.cover_url : null

    const book = await setMyBook({ meetupMemberId: memberId, bookTitle: book_title, author, coverUrl: cover_url })
    return NextResponse.json({ book })
  } catch {
    return new NextResponse("Failed to update book", { status: 500 })
  }
}

