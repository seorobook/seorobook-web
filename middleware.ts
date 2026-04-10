import { type NextRequest, NextResponse } from "next/server"

/** Browsers only send this for pages served from the user's machine (e.g. Expo web on :8081). */
function isLocalhostHttpOrigin(origin: string): boolean {
  try {
    const u = new URL(origin)
    if (u.protocol !== "http:") return false
    const h = u.hostname
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1"
  } catch {
    return false
  }
}

/**
 * CORS for `/api/*`:
 * - Development: localhost / same-host (Expo web on another port).
 * - Production: Expo web often calls production API (`EXPO_PUBLIC_API_BASE_URL=https://…`) from
 *   `http://localhost:PORT` — browsers require CORS on every `/api/*` route (auth, mobile, books, blob…).
 *   We allow `http://localhost` / `http://127.0.0.1` (any port) without env; plus exact Origins in
 *   `MOBILE_API_CORS_ORIGINS` (e.g. `https://….exp.direct`). Native apps do not use CORS.
 */
function corsAllowOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin")
  if (!origin) return null
  const pathname = request.nextUrl.pathname
  if (!pathname.startsWith("/api/")) return null

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

  if (isLocalhostHttpOrigin(origin)) return origin

  const raw = process.env.MOBILE_API_CORS_ORIGINS?.trim()
  if (raw) {
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
