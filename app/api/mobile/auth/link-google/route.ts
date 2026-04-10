import { NextResponse } from "next/server"
import { neonAuthPost } from "@/lib/mobile-auth-forward"

function parseAuthErrorMessage(raw: string): string {
  try {
    const j = JSON.parse(raw) as { message?: string; code?: string }
    return j.message || j.code || raw
  } catch {
    return raw
  }
}

/**
 * Link Google to the current session (email/password user, same Google email).
 * Requires `Cookie` header from the mobile client. Duplicate link returns success (idempotent).
 */
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader?.trim()) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const idToken = typeof body?.id_token === "string" ? body.id_token.trim() : ""
    const accessToken = typeof body?.access_token === "string" ? body.access_token.trim() : undefined
    const nonce = typeof body?.nonce === "string" ? body.nonce.trim() : undefined
    if (!idToken) {
      return NextResponse.json({ error: "id_token is required" }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const res = await neonAuthPost(
      origin,
      ["link-social"],
      {
        provider: "google",
        idToken: {
          token: idToken,
          ...(accessToken ? { accessToken } : {}),
          ...(nonce ? { nonce } : {}),
        },
      },
      { cookie: cookieHeader },
    )

    const raw = await res.text()
    if (!res.ok) {
      return NextResponse.json(
        { error: parseAuthErrorMessage(raw || "Link Google failed") },
        { status: res.status === 401 ? 401 : 400 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to link Google" }, { status: 500 })
  }
}
