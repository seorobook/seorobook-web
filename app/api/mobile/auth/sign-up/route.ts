import { NextResponse } from "next/server"
import { applyMobileSessionCookies } from "@/lib/apply-mobile-session-cookies"
import { ensureProfile } from "@/data/profiles"
import {
  cookieHeaderFromSetCookieResponse,
  fetchJsonWithSession,
  neonAuthPost,
} from "@/lib/mobile-auth-forward"
import { toMobileAuthUser } from "@/lib/mobile-auth-user"

function parseAuthPayload(raw: string): { message?: string; token?: string | null; user?: { id: string; email?: string | null; name?: string | null } } | null {
  try {
    return raw ? (JSON.parse(raw) as { message?: string; token?: string | null; user?: { id: string; email?: string | null; name?: string | null } }) : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email and password required" }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    /** Omit callbackURL so Neon-hosted Better Auth does not run trustedOrigins on it (localhost is often not listed). */
    const signUpRes = await neonAuthPost(origin, ["sign-up", "email"], {
      name,
      email,
      password,
    })

    const raw = await signUpRes.text()
    const parsed = parseAuthPayload(raw)

    if (!signUpRes.ok) {
      const msg = parsed?.message || raw || "Sign up failed"
      const lower = msg.toLowerCase()
      let hint = msg
      if (lower.includes("already") || lower.includes("exist")) {
        hint = `${msg} 같은 이메일로 이미 가입했다면 로그인하거나 Google로 로그인해 보세요.`
      }
      return NextResponse.json(
        { error: hint },
        { status: signUpRes.status >= 400 && signUpRes.status < 500 ? signUpRes.status : 400 },
      )
    }

    const cookieHeader = cookieHeaderFromSetCookieResponse(signUpRes)
    if (!cookieHeader) {
      // MVP: email verification is disabled; we expect auto sign-in and a session cookie.
      return NextResponse.json(
        { error: parsed?.message || "No session cookie from auth" },
        { status: 500 },
      )
    }

    const { sessionData } = await fetchJsonWithSession(origin, cookieHeader)
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: "Session not established" }, { status: 500 })
    }

    await ensureProfile({
      id: sessionData.user.id,
      kind: "member",
      nickname: name || sessionData.user.name || sessionData.user.email?.split("@")[0] || "사용자",
    })

    const user = toMobileAuthUser(sessionData.user)
    if (!user) return NextResponse.json({ error: "Invalid user in session" }, { status: 500 })

    const res = NextResponse.json({
      cookie: cookieHeader,
      user,
    })
    return applyMobileSessionCookies(res, cookieHeader)
  } catch {
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 })
  }
}
