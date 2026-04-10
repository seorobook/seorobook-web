import { NextResponse } from "next/server"

export const runtime = "nodejs"

function isAllowedBlobUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:") return false
    // Vercel Blob domains end with `.blob.vercel-storage.com`
    return u.hostname.endsWith(".blob.vercel-storage.com")
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() || ""
  if (!token) return new NextResponse("Blob token not configured", { status: 503 })

  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")?.trim() || ""
  if (!url) return new NextResponse("Missing url", { status: 400 })
  if (!isAllowedBlobUrl(url)) return new NextResponse("Invalid url", { status: 400 })

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return new NextResponse("Not found", { status: 404 })

  const contentType = res.headers.get("content-type") || "application/octet-stream"
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

