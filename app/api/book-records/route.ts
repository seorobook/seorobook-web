import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createBookRecord, type BookRecordStatus } from "@/data/bookRecords"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json().catch(() => null)
    const catalog_book_id = typeof body?.catalog_book_id === "string" ? body.catalog_book_id : null
    const user_book_id = typeof body?.user_book_id === "string" ? body.user_book_id : null
    const status = typeof body?.status === "string" ? (body.status as BookRecordStatus) : null
    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 })

    const progress_percent = typeof body?.progress_percent === "number" ? body.progress_percent : 0
    const wishlist = typeof body?.wishlist === "boolean" ? body.wishlist : false
    const tags = Array.isArray(body?.tags) ? body.tags : null

    const record = await createBookRecord({
      userId: session.user.id,
      catalogBookId: catalog_book_id,
      userBookId: user_book_id,
      status,
      progressPercent: progress_percent,
      wishlist,
      tags,
    })

    return NextResponse.json({ record })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}

