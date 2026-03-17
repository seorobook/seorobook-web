import { query } from "./db"

export type ProfileRow = {
  id: string
  nickname: string | null
  skin: string | null
  visited_library_share_ids: string[] | null
}

function isMissingProfilesRelation(err: any): boolean {
  return err?.code === "42P01" && typeof err?.message === "string" && err.message.includes('relation "profiles" does not exist')
}

export async function getProfileById(id: string): Promise<ProfileRow | null> {
  try {
    const { rows } = await query<ProfileRow>(
      `select id, nickname, skin, visited_library_share_ids
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
export async function ensureProfile(id: string): Promise<void> {
  try {
    await query(
      `insert into profiles (id, nickname, skin, visited_library_share_ids)
       values ($1, null, null, '{}')
       on conflict (id) do nothing`,
      [id],
    )
  } catch (err: any) {
    if (isMissingProfilesRelation(err)) return
    throw err
  }
}

export async function updateProfileNickname(id: string, nickname: string | null): Promise<void> {
  const value = nickname?.trim() || null
  await query(
    `update profiles set nickname = $2 where id = $1`,
    [id, value],
  )
}

export async function updateProfileSkin(id: string, skin: string): Promise<void> {
  await query(
    `update profiles
     set skin = $2
     where id = $1`,
    [id, skin],
  )
}

