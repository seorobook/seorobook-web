import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

const jwksUrl =
  process.env.NEON_AUTH_JWKS_URL ||
  (process.env.NEON_AUTH_BASE_URL
    ? `${process.env.NEON_AUTH_BASE_URL.replace(/\/$/, "")}/jwks`
    : null)

if (!jwksUrl) {
  throw new Error("NEON_AUTH_JWKS_URL (or NEON_AUTH_BASE_URL) must be set")
}

const JWKS = createRemoteJWKSet(new URL(jwksUrl))

export type VerifiedUser = {
  id: string
  email?: string | null
  payload: JWTPayload
}

export async function verifyBearerToken(token: string): Promise<VerifiedUser> {
  const { payload } = await jwtVerify(token, JWKS)

  const id = typeof payload.sub === "string" ? payload.sub : ""
  if (!id) {
    throw new Error("Token missing sub")
  }

  const email =
    typeof (payload as any).email === "string"
      ? ((payload as any).email as string)
      : typeof (payload as any).user?.email === "string"
        ? ((payload as any).user.email as string)
        : null

  return { id, email, payload }
}

