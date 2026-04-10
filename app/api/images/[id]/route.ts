import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { query } from "@/data/db"

export const runtime = "nodejs"

type ImageRow = {
  id: string
  public_url: string | null
  content_type: string | null
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await context.params
  const { rows } = await query<ImageRow>(
    `select id, public_url, content_type from images where id = $1 limit 1`,
    [id],
  )
  const img = rows[0]
  if (!img?.public_url) return new NextResponse("Not found", { status: 404 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return new NextResponse("Not configured", { status: 501 })

  const res = await fetch(img.public_url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })
  if (!res.ok || !res.body) return new NextResponse("Bad gateway", { status: 502 })

  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "Content-Type": img.content_type || res.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  })
}

