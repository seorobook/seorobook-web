import { NextResponse } from "next/server"
import { ensureProfile } from "@/data/profiles"
import {
  cookieHeaderFromSetCookieResponse,
  fetchJsonWithSession,
  forwardAuthCookies,
  neonAuthPost,
} from "@/lib/mobile-auth-forward"
import { toMobileAuthUser } from "@/lib/mobile-auth-user"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const signInRes = await neonAuthPost(origin, ["sign-in", "email"], { email, password })

    // Read Set-Cookie before consuming the body (some runtimes keep headers intact only until then).
    const cookieHeader = cookieHeaderFromSetCookieResponse(signInRes)

    const raw = await signInRes.text()
    let data: { message?: string } | null = null
    try {
      data = raw ? (JSON.parse(raw) as { message?: string }) : null
    } catch {
      data = null
    }

    if (!signInRes.ok) {
      return NextResponse.json(
        { error: data?.message || raw || "Sign in failed" },
        { status: signInRes.status === 401 ? 401 : 400 },
      )
    }
    if (!cookieHeader) {
      return NextResponse.json({ error: "No session cookie from auth" }, { status: 500 })
    }

    const { sessionData } = await fetchJsonWithSession(origin, cookieHeader)
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: "Session not established" }, { status: 500 })
    }

    await ensureProfile({
      id: sessionData.user.id,
      kind: "member",
      nickname: sessionData.user.name || sessionData.user.email?.split("@")[0] || "사용자",
    })

    const user = toMobileAuthUser(sessionData.user)
    if (!user) return NextResponse.json({ error: "Invalid user in session" }, { status: 500 })

    const res = NextResponse.json({
      cookie: cookieHeader,
      user,
    })
    // Forward the original Set-Cookie headers from Neon Auth verbatim.
    // This preserves all security attributes (HttpOnly, Secure, SameSite, Expires)
    // so browsers (Expo web) receive a properly-attributed session cookie instead
    // of a manually re-issued one stripped of its attributes.
    forwardAuthCookies(signInRes, res)
    return res
  } catch {
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
