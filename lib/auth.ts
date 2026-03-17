import { createNeonAuth } from "@neondatabase/auth/next/server"

function getAppBaseUrl() {
  if (process.env.NEON_AUTH_BASE_URL) return process.env.NEON_AUTH_BASE_URL

  // Vercel Preview/Prod provides VERCEL_URL without protocol.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  // Local dev fallback.
  return "http://localhost:3000"
}

const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
if (!cookieSecret) {
  throw new Error("NEON_AUTH_COOKIE_SECRET must be set")
}

export const auth = createNeonAuth({
  baseUrl: getAppBaseUrl(),
  cookies: {
    secret: cookieSecret,
  },
})

