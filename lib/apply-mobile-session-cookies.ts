import { NextResponse } from "next/server"

/**
 * Mirror the combined Cookie header string onto Set-Cookie so browsers (Expo web)
 * can use credentials: "include"; native apps still read `cookie` from JSON.
 */
export function applyMobileSessionCookies(response: NextResponse, cookieHeader: string): NextResponse {
  const trimmed = cookieHeader.trim()
  if (!trimmed) return response

  for (const segment of trimmed.split(";")) {
    const part = segment.trim()
    if (!part.includes("=")) continue
    const i = part.indexOf("=")
    const name = part.slice(0, i).trim()
    const value = part.slice(i + 1).trim()
    if (!name) continue

    const strict = name.startsWith("__Secure-") || name.startsWith("__Host-")
    response.cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: strict || process.env.NODE_ENV === "production",
    })
  }
  return response
}
