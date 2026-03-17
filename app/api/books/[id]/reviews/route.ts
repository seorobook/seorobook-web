import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBookById } from "@/data/books"
import { listReviewsByBookIdForUser, createReview } from "@/data/reviews"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id: bookId } = await params
    const book = await getBookById(bookId)
    if (!book || book.user_id !== session.user.id) {
      return new NextResponse("Not found", { status: 404 })
    }
    const reviews = await listReviewsByBookIdForUser(bookId, session.user.id)
    return NextResponse.json({ reviews })
  } catch {
    return new NextResponse("Failed to list reviews", { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id: bookId } = await params
    const book = await getBookById(bookId)
    if (!book || book.user_id !== session.user.id) {
      return new NextResponse("Not found", { status: 404 })
    }
    const body = await request.json().catch(() => null)
    const content = typeof body?.content === "string" ? body.content : ""
    const visibility =
      body?.visibility === "public" || body?.visibility === "sero"
        ? body.visibility
        : "private"
    if (!content.trim()) {
      return new NextResponse("Content is required", { status: 400 })
    }
    const review = await createReview(
      session.user.id,
      bookId,
      content,
      visibility as "private" | "public" | "sero",
    )
    return NextResponse.json({ review })
  } catch {
    return new NextResponse("Failed to create review", { status: 500 })
  }
}
