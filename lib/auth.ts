/**
 * Stub — Neon Auth was deleted as part of the Path B migration. The web
 * package no longer issues sessions; it serves only the guest-meet pages
 * (`/meet/*`), which use invite-code-based join tokens stored in the
 * browser, not Better Auth.
 *
 * Routes that still import `auth` are vestigial host/member meetup
 * handlers that will be moved to FastAPI under `/v1/meetups/*` (task
 * #63) and then deleted from this package. Until that lands, calling
 * any method on this stub throws — failures are loud, not silent.
 */

const stubError = () => {
  throw new Error(
    "lib/auth.ts is a stub: Neon Auth was removed. " +
      "Move this caller to api.seorobook.com/v1/meetups/* (task #63) or delete the route.",
  )
}

export const auth = {
  getSession: stubError as () => Promise<never>,
  handler: stubError as () => Promise<never>,
} as const
