/** Strip server session/user to the minimum the mobile client needs (no tokens in JSON). */
export type MobileAuthUser = {
  id: string
  email: string | null
  name: string | null
}

export function toMobileAuthUser(user: {
  id: string
  email?: string | null
  name?: string | null
} | null | undefined): MobileAuthUser | null {
  if (!user?.id) return null
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
  }
}
