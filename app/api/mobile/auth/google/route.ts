import { NextResponse } from "next/server"
import { ensureProfile } from "@/data/profiles"
import {
  cookieHeaderFromSetCookieResponse,
  fetchJsonWithSession,
  neonAuthPost,
} from "@/lib/mobile-auth-forward"
import { toMobileAuthUser } from "@/lib/mobile-auth-user"

function parseAuthErrorMessage(raw: string): string {
  try {
    const j = JSON.parse(raw) as { message?: string; code?: string }
    return j.message || j.code || raw
  } catch {
    return raw
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const idToken = typeof body?.id_token === "string" ? body.id_token.trim() : ""
    const accessToken = typeof body?.access_token === "string" ? body.access_token.trim() : undefined
    const nonce = typeof body?.nonce === "string" ? body.nonce.trim() : undefined
    if (!idToken) {
      return NextResponse.json({ error: "id_token is required" }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const signInRes = await neonAuthPost(origin, ["sign-in", "social"], {
      provider: "google",
      idToken: {
        token: idToken,
        ...(accessToken ? { accessToken } : {}),
        ...(nonce ? { nonce } : {}),
      },
    })

    const raw = await signInRes.text()
    if (!signInRes.ok) {
      return NextResponse.json(
        { error: parseAuthErrorMessage(raw || "Google sign-in failed") },
        { status: signInRes.status === 401 ? 401 : 400 },
      )
    }

    const cookieHeader = cookieHeaderFromSetCookieResponse(signInRes)
    if (!cookieHeader) {
      return NextResponse.json(
        {
          error:
            "No session cookie from Google sign-in. Check Neon Auth: Google provider enabled and account linking for existing emails.",
        },
        { status: 500 },
      )
    }

    const { sessionData } = await fetchJsonWithSession(origin, cookieHeader)
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: "Session not established after Google sign-in" }, { status: 500 })
    }

    await ensureProfile({
      id: sessionData.user.id,
      kind: "member",
      nickname: sessionData.user.name || sessionData.user.email?.split("@")[0] || "사용자",
    })

    const user = toMobileAuthUser(sessionData.user)
    if (!user) return NextResponse.json({ error: "Invalid user in session" }, { status: 500 })

    return NextResponse.json({
      cookie: cookieHeader,
      user,
    })
  } catch {
    return NextResponse.json({ error: "Failed to sign in with Google" }, { status: 500 })
  }
}
