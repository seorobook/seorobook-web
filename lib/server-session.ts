export type SessionUser = { id: string; email?: string | null; name?: string | null }
export type ServerSession = { user: SessionUser } | null

/**
 * Stub — Neon Auth was deleted as part of the Path B migration. Mobile
 * clients now sign in directly against Better Auth (auth.seorobook.com)
 * and the FastAPI gateway verifies their JWTs via JWKS.
 *
 * Web's surviving surface (`/meet/*`) uses guest tokens (no session), so
 * routes that previously called `getSession()` no longer have a working
 * auth path. They will be ported to FastAPI under `/v1/meetups/*` (task
 * #63) and the corresponding `app/api/meetups/*` handlers deleted.
 *
 * Until that lands, any host/member-auth meetup route stays wired but
 * returns 503 here so the failure mode is loud rather than mysteriously
 * `null`.
 */
export async function getSession(_request: Request): Promise<ServerSession> {
  return null
}
