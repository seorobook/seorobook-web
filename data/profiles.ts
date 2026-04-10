import { query } from "./db"

export type ProfileRow = {
  id: string
  nickname: string
  kind: "member" | "guest"
  created_at: string
}

function isMissingProfilesRelation(err: any): boolean {
  return err?.code === "42P01" && typeof err?.message === "string" && err.message.includes('relation "profiles" does not exist')
}

export async function getProfileById(id: string): Promise<ProfileRow | null> {
  try {
    const { rows } = await query<ProfileRow>(
      `select id, nickname, kind, created_at
       from profiles
       where id = $1
       limit 1`,
      [id],
    )
    return rows[0] ?? null
  } catch (err: any) {
    if (isMissingProfilesRelation(err)) return null
    throw err
  }
}

/** 최초 로그인 등으로 프로필 행이 없으면 생성. id = auth user id. */
export async function ensureProfile(params: {
  id: string
  nickname?: string | null
  kind: "member" | "guest"
}): Promise<void> {
  try {
    const nickname = (params.nickname ?? "").trim() || (params.kind === "guest" ? "게스트" : "사용자")
    await query(
      `insert into profiles (id, nickname, kind)
       values ($1, $2, $3)
       on conflict (id) do nothing`,
      [params.id, nickname, params.kind],
    )
  } catch (err: any) {
    if (isMissingProfilesRelation(err)) return
    throw err
  }
}

export async function updateProfileNickname(id: string, nickname: string): Promise<void> {
  const value = nickname.trim()
  await query(
    `update profiles set nickname = $2 where id = $1`,
    [id, value],
  )
}

