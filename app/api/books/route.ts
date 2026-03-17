import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listBooksByUserId, createBook } from "@/data/books"

export async function GET() {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const books = await listBooksByUserId(session.user.id)
    return NextResponse.json({ books })
  } catch {
    return new NextResponse("Failed to list books", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const body = await request.json().catch(() => null)
    const title = typeof body?.title === "string" ? body.title : ""
    const author = typeof body?.author === "string" ? body.author : null
    const readAt = typeof body?.read_at === "string" ? body.read_at : null
    if (!title.trim()) {
      return new NextResponse("Title is required", { status: 400 })
    }
    const book = await createBook(session.user.id, title, author, readAt)
    return NextResponse.json({ book })
  } catch {
    return new NextResponse("Failed to create book", { status: 500 })
  }
}
