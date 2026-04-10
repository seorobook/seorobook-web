import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createUserBook, setPrimaryUserBookCover } from "@/data/userBooks"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json().catch(() => null)
    const title = typeof body?.title === "string" ? body.title : ""
    const isbn13 = typeof body?.isbn13 === "string" ? body.isbn13 : null
    const pages = typeof body?.pages === "number" ? body.pages : null
    const language = typeof body?.language === "string" ? body.language : null
    const publisher = typeof body?.publisher === "string" ? body.publisher : null
    const publish_date = typeof body?.publish_date === "string" ? body.publish_date : null
    const abstract = typeof body?.abstract === "string" ? body.abstract : null
    const author_text = typeof body?.author_text === "string" ? body.author_text : null
    const translator_text = typeof body?.translator_text === "string" ? body.translator_text : null
    const illustrator_text = typeof body?.illustrator_text === "string" ? body.illustrator_text : null
    const narrator_text = typeof body?.narrator_text === "string" ? body.narrator_text : null
    const image_id = typeof body?.image_id === "string" ? body.image_id : null

    const book = await createUserBook({
      userId: session.user.id,
      title,
      isbn13,
      pages,
      language,
      publisher,
      publishDate: publish_date,
      abstract,
      authorText: author_text,
      translatorText: translator_text,
      illustratorText: illustrator_text,
      narratorText: narrator_text,
    })

    if (image_id) {
      await setPrimaryUserBookCover({
        userBookId: book.id,
        imageId: image_id,
        addedByUserId: session.user.id,
      })
    }

    return NextResponse.json({ book })
  } catch {
    return new NextResponse("Failed to create user book", { status: 500 })
  }
}

