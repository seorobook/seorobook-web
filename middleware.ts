import { type NextRequest, NextResponse } from "next/server"

import { apiCorsAllowOrigin } from "@/lib/api-cors"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/api/")) return NextResponse.next()

  const allow = apiCorsAllowOrigin(request)

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
