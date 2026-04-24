import { auth } from "@/lib/auth"
import { neonAuthGet } from "@/lib/mobile-auth-forward"

const NEON_SESSION_TOKEN_COOKIE = "__Secure-neon-auth.session_token"

export type SessionUser = { id: string; email?: string | null; name?: string | null }
export type ServerSession = { user: SessionUser } | null

/**
 * Robust session getter for API route handlers.
 *
 * WHY NOT auth.getSession() ALONE:
 * The SDK's auth.getSession() calls the Neon Auth endpoint directly without
 * attaching the trusted origin header (NEON_AUTH_BASE_URL origin). Neon Auth /
 * Better Auth performs origin validation and rejects requests whose Origin
 * header is empty, "localhost", or any untrusted value — which is exactly what
 * server-side SDK calls produce. This causes getSession() to silently return
 * null for all mobile-app and Expo-web clients despite a valid session token.
 *
 * HOW THIS FIXES IT:
 * When the SDK call returns null, we fall back to neonAuthGet() which goes
 * through auth.handler() with neonTrustedOriginHeaders() — the same trusted-
 * origin path used by /api/auth/get-session and the mobile-auth proxy. This
 * always succeeds for a valid session token.
 *
 * Usage in route handlers:
 *   const session = await getSession(request)
 *   if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })
 */
export async function getSession(request: Request): Promise<ServerSession> {
  // Primary path: SDK reads via next/headers(). Works when the Next.js async
  // context carries the correct Cookie header (most server-component contexts).
  try {
    const { data: session } = await auth.getSession()
    if (session?.user?.id) return session as ServerSession
  } catch {
    // SDK call failed (e.g., no async context). Fall through to manual path.
  }

  // Fallback: extract session token from the request's own Cookie header and
  // validate it through auth.handler() which sets the trusted NEON_AUTH_BASE_URL
  // origin — bypassing Better Auth's untrusted-origin rejection.
  const cookieHeader = request.headers.get("cookie") ?? ""
  if (!cookieHeader.includes(NEON_SESSION_TOKEN_COOKIE + "=")) return null

  try {
    const origin = new URL(request.url).origin
    const sessionRes = await neonAuthGet(origin, ["get-session"], cookieHeader)
    if (!sessionRes.ok) return null
    const data = (await sessionRes.json().catch(() => null)) as {
      user?: SessionUser
    } | null
    return data?.user?.id ? { user: data.user } : null
  } catch {
    return null
  }
}
