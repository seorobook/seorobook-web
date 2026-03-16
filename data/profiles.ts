import { query } from "./db"

export type ProfileRow = {
  id: string
  skin: string | null
  visited_realms: string[] | null
}

export async function getProfileById(id: string): Promise<ProfileRow | null> {
  const { rows } = await query<ProfileRow>(
    `select id, skin, visited_realms
     from profiles
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function updateProfileSkin(id: string, skin: string): Promise<void> {
  await query(
    `update profiles
     set skin = $2
     where id = $1`,
    [id, skin],
  )
}

