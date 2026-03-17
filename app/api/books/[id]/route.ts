import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBookById, updateBook, deleteBook } from "@/data/books"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id } = await params
    const book = await getBookById(id)
    if (!book || book.user_id !== session.user.id) {
      return new NextResponse("Not found", { status: 404 })
    }
    return NextResponse.json({ book })
  } catch {
    return new NextResponse("Failed to get book", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id } = await params
    const book = await getBookById(id)
    if (!book || book.user_id !== session.user.id) {
      return new NextResponse("Not found", { status: 404 })
    }
    const body = await request.json().catch(() => null)
    const ok = await updateBook(id, session.user.id, {
      title: body?.title,
      author: body?.author,
      read_at: body?.read_at,
    })
    if (!ok) return new NextResponse("Failed to update", { status: 500 })
    const updated = await getBookById(id)
    return NextResponse.json({ book: updated })
  } catch {
    return new NextResponse("Failed to update book", { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id } = await params
    const ok = await deleteBook(id, session.user.id)
    if (!ok) return new NextResponse("Not found", { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return new NextResponse("Failed to delete book", { status: 500 })
  }
}
