import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getSession } from "@/lib/server-session"
import { upsertImage } from "@/data/images"

export const runtime = "nodejs"

function isImageMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp"
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: "Blob token is not configured (BLOB_READ_WRITE_TOKEN)" },
        { status: 501 },
      )
    }

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }
    if (!isImageMime(file.type)) {
      return NextResponse.json({ error: "unsupported image type" }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large (max 5MB)" }, { status: 400 })
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    const key = `images/${session.user.id}/${crypto.randomUUID()}.${ext}`

    const blob = await put(key, file, {
      access: "private",
      token,
      contentType: file.type,
      addRandomSuffix: false,
    })

    const image = await upsertImage({
      provider: "vercel_blob",
      key,
      publicUrl: blob.url,
      contentType: file.type,
      bytes: file.size,
    })

    const origin = new URL(request.url).origin
    const url = `${origin}/api/images/${image.id}`
    return NextResponse.json({ image: { id: image.id, url } })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error"
    return NextResponse.json({ error: "Failed to upload image", message }, { status: 500 })
  }
}

