import { type NextRequest, NextResponse } from "next/server"

const MOBILE_API_PREFIX = "/api/mobile/"

/**
 * CORS for `/api/*`:
 * - Development: localhost / same-host (Expo web on another port).
 * - Production: only `/api/mobile/*` when `MOBILE_API_CORS_ORIGINS` lists the browser `Origin`
 *   (Expo web hitting production API). Native iOS/Android fetch does not use CORS.
 */
function corsAllowOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin")
  if (!origin) return null
  const pathname = request.nextUrl.pathname

  if (process.env.NODE_ENV === "development") {
    try {
      const u = new URL(origin)
      const host = request.nextUrl.hostname
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return origin
      if (u.hostname === host) return origin
    } catch {
      /* ignore */
    }
    return null
  }

  if (pathname.startsWith(MOBILE_API_PREFIX)) {
    const raw = process.env.MOBILE_API_CORS_ORIGINS?.trim()
    if (!raw) return null
    const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean)
    if (allowed.includes(origin)) return origin
  }

  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/api/")) return NextResponse.next()

  const allow = corsAllowOrigin(request)

  if (request.method === "OPTIONS") {
    const h = new Headers()
    if (allow) {
      h.set("Access-Control-Allow-Origin", allow)
      h.set("Access-Control-Allow-Credentials", "true")
    }
    h.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")
    h.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With")
    h.set("Access-Control-Max-Age", "86400")
    return new NextResponse(null, { status: 204, headers: h })
  }

  const res = NextResponse.next()
  if (allow) {
    res.headers.set("Access-Control-Allow-Origin", allow)
    res.headers.set("Access-Control-Allow-Credentials", "true")
  }
  return res
}

export const config = {
  matcher: "/api/:path*",
}
