import { createNeonAuth } from "@neondatabase/auth/next/server"

/** Neon Auth hosted endpoint only — not your Next.js site URL. */
function getNeonAuthBaseUrl() {
  const raw = process.env.NEON_AUTH_BASE_URL?.trim()
  if (!raw) {
    throw new Error(
      "NEON_AUTH_BASE_URL is required (Neon Console → Auth → API URL, e.g. https://ep-xxx.neonauth.us-east-1.aws.neon.tech).",
    )
  }
  return raw.replace(/\/+$/, "")
}

const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
if (!cookieSecret) {
  throw new Error("NEON_AUTH_COOKIE_SECRET must be set")
}

export const auth = createNeonAuth({
  baseUrl: getNeonAuthBaseUrl(),
  cookies: {
    secret: cookieSecret,
    // Session data cookie is only a cache. Make it long enough to avoid intermittent exp validation failures.
    // (The real auth is session_token; this just reduces upstream /get-session calls.)
    sessionDataTtl: 60 * 60, // 1 hour
  },
})

