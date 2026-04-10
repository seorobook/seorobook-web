import type { NextRequest } from "next/server"

/**
 * Shared rules for browser CORS on `/api/*`.
 *
 * Security notes:
 * - Native apps do not use CORS; this only affects browsers (Expo web, devtools).
 * - `MOBILE_API_CORS_ORIGINS`: exact `Origin` allowlist (e.g. `https://….exp.direct`).
 * - Localhost in production: opt-out via `API_CORS_ALLOW_LOCALHOST=false` (then only the env list applies).
 * - A random website cannot send `Origin: http://localhost:8081` from a victim’s tab; only pages served
 *   from that origin can. Tighten production by disabling localhost and listing Origins explicitly.
 */
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

function allowLocalhostInProduction(): boolean {
  const v = process.env.API_CORS_ALLOW_LOCALHOST?.trim().toLowerCase()
  if (v === "0" || v === "false" || v === "no") return false
  return true
}

/** Returns allowed `Origin` to echo, or null (browser gets no ACAO → CORS fail). */
export function apiCorsAllowOrigin(request: NextRequest): string | null {
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

  if (allowLocalhostInProduction() && isLocalhostHttpOrigin(origin)) return origin

  const raw = process.env.MOBILE_API_CORS_ORIGINS?.trim()
  if (raw) {
    const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean)
    if (allowed.includes(origin)) return origin
  }

  return null
}
