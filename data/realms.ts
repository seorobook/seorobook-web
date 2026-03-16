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

export async function updateRealmMapData(
  id: string,
  ownerId: string,
  mapData: any,
): Promise<void> {
  await query(
    `update realms
     set map_data = $3
     where id = $1
       and owner_id = $2`,
    [id, ownerId, mapData],
  )
}

export async function createRealm(
  ownerId: string,
  name: string,
  mapData: any | null,
): Promise<RealmRow> {
  const { rows } = await query<RealmRow>(
    `insert into realms (owner_id, name, map_data)
     values ($1, $2, $3)
     returning id, owner_id, name, map_data, share_id, only_owner`,
    [ownerId, name, mapData],
  )
  return rows[0]
}

type RealmMetaUpdate = {
  name?: string
  only_owner?: boolean
  share_id?: string | null
}

export async function updateRealmMeta(
  id: string,
  ownerId: string,
  meta: RealmMetaUpdate,
): Promise<void> {
  const fields: string[] = []
  const values: any[] = [id, ownerId]

  if (meta.name !== undefined) {
    fields.push(`name = $${values.length + 1}`)
    values.push(meta.name)
  }

  if (meta.only_owner !== undefined) {
    fields.push(`only_owner = $${values.length + 1}`)
    values.push(meta.only_owner)
  }

  if (meta.share_id !== undefined) {
    fields.push(`share_id = $${values.length + 1}`)
    values.push(meta.share_id)
  }

  if (fields.length === 0) {
    return
  }

  await query(
    `update realms
     set ${fields.join(", ")}
     where id = $1
       and owner_id = $2`,
    values,
  )
}



