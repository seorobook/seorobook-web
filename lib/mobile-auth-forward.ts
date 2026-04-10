import { auth } from "@/lib/auth"

/** Better Auth originCheck trusts NEON_AUTH_BASE_URL origin — not localhost when the request is synthetic. */
function neonTrustedOriginHeaders(): Record<string, string> {
  const raw = process.env.NEON_AUTH_BASE_URL?.trim()
  if (!raw) return {}
  try {
    const o = new URL(raw).origin
    return { Origin: o }
  } catch {
    return {}
  }
}

/**
 * Run the same Neon Auth proxy as GET /api/auth/[...path] (no loopback HTTP).
 * Request.url must be the absolute /api/auth/... URL so the proxy can derive Origin.
 */
export async function neonAuthGet(origin: string, pathSegments: string[], cookieHeader: string): Promise<Response> {
  const joined = pathSegments.join("/")
  const url = `${origin}/api/auth/${joined}`
  const req = new Request(url, {
    method: "GET",
    headers: { ...neonTrustedOriginHeaders(), Cookie: cookieHeader },
  })
  const { GET } = auth.handler()
  return GET(req, { params: Promise.resolve({ path: pathSegments }) })
}

export async function neonAuthPost(
  origin: string,
  pathSegments: string[],
  body: Record<string, unknown>,
  opts?: { cookie?: string },
): Promise<Response> {
  const joined = pathSegments.join("/")
  const url = `${origin}/api/auth/${joined}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...neonTrustedOriginHeaders(),
  }
  if (opts?.cookie?.trim()) headers.Cookie = opts.cookie.trim()
  const req = new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const { POST } = auth.handler()
  return POST(req, { params: Promise.resolve({ path: pathSegments }) })
}

/** Server-only: turn fetch Response Set-Cookie headers into a Cookie request header value. */
export function cookieHeaderFromSetCookieResponse(res: Response): string {
  const lines = getSetCookieLines(res)
  return cookieHeaderFromSetCookieLines(lines)
}

function getSetCookieLines(res: Response): string[] {
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof anyHeaders.getSetCookie === "function") {
    return anyHeaders.getSetCookie()
  }
  const single = res.headers.get("set-cookie")
  return single ? [single] : []
}

/**
 * Build a single Cookie header from Set-Cookie lines.
 * Later headers win if the same cookie name appears more than once (e.g. refresh).
 */
export function cookieHeaderFromSetCookieLines(setCookies: string[]): string {
  const byName = new Map<string, string>()
  for (const line of setCookies) {
    const pair = line.split(";")[0]?.trim()
    if (!pair?.includes("=")) continue
    const i = pair.indexOf("=")
    const name = pair.slice(0, i).trim()
    if (!name) continue
    byName.set(name, pair)
  }
  return [...byName.values()].join("; ")
}

export async function fetchJsonWithSession(origin: string, cookieHeader: string) {
  const sessionRes = await neonAuthGet(origin, ["get-session"], cookieHeader)
  const sessionData = (await sessionRes.json().catch(() => null)) as {
    user?: { id: string; email?: string | null; name?: string | null }
    session?: unknown
  } | null
  return { sessionRes, sessionData }
}
