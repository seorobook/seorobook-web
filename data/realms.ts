import { query } from "./db"

export type RealmRow = {
  id: string
  owner_id: string
  name: string
  map_data: any
  share_id: string | null
  only_owner: boolean | null
}

export async function listRealmsByOwner(ownerId: string): Promise<RealmRow[]> {
  const { rows } = await query<RealmRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from realms
     where owner_id = $1
     order by created_at desc nulls last`,
    [ownerId],
  )
  return rows
}

export async function getRealmById(id: string): Promise<RealmRow | null> {
  const { rows } = await query<RealmRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from realms
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function getRealmByShareId(shareId: string): Promise<RealmRow | null> {
  const { rows } = await query<RealmRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from realms
     where share_id = $1
     limit 1`,
    [shareId],
  )
  return rows[0] ?? null
}

