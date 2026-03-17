import { query } from "./db"

export type LibraryRow = {
  id: string
  owner_id: string
  name: string
  map_data: any
  share_id: string | null
  only_owner: boolean | null
}

/** Minimal default map: one room, empty tilemap. User decorates or adds objects later. */
const DEFAULT_MAP_DATA = {
  spawnpoint: { roomIndex: 0, x: 0, y: 0 },
  rooms: [{ name: "My Room", tilemap: {} }],
} as const

export async function getLibraryByOwnerId(ownerId: string): Promise<LibraryRow | null> {
  const { rows } = await query<LibraryRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from libraries
     where owner_id = $1
     limit 1`,
    [ownerId],
  )
  return rows[0] ?? null
}

/** Ensure user has exactly one library (default). Create with minimal map if none. */
export async function getOrCreateDefaultLibrary(ownerId: string): Promise<LibraryRow> {
  const existing = await getLibraryByOwnerId(ownerId)
  if (existing) return existing
  return createLibrary(ownerId, "내 서재", DEFAULT_MAP_DATA)
}

export async function listLibrariesByOwner(ownerId: string): Promise<LibraryRow[]> {
  const { rows } = await query<LibraryRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from libraries
     where owner_id = $1
     order by created_at desc nulls last`,
    [ownerId],
  )
  return rows
}

export async function getLibraryById(id: string): Promise<LibraryRow | null> {
  const { rows } = await query<LibraryRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from libraries
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function getLibraryByShareId(shareId: string): Promise<LibraryRow | null> {
  const { rows } = await query<LibraryRow>(
    `select id, owner_id, name, map_data, share_id, only_owner
     from libraries
     where share_id = $1
     limit 1`,
    [shareId],
  )
  return rows[0] ?? null
}

export async function updateLibraryMapData(
  id: string,
  ownerId: string,
  mapData: any,
): Promise<void> {
  await query(
    `update libraries
     set map_data = $3
     where id = $1
       and owner_id = $2`,
    [id, ownerId, mapData],
  )
}

export async function createLibrary(
  ownerId: string,
  name: string,
  mapData: any | null,
): Promise<LibraryRow> {
  const { rows } = await query<LibraryRow>(
    `insert into libraries (owner_id, name, map_data)
     values ($1, $2, $3)
     returning id, owner_id, name, map_data, share_id, only_owner`,
    [ownerId, name, mapData],
  )
  return rows[0]
}

type LibraryMetaUpdate = {
  name?: string
  only_owner?: boolean
  share_id?: string | null
}

export async function updateLibraryMeta(
  id: string,
  ownerId: string,
  meta: LibraryMetaUpdate,
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
    `update libraries
     set ${fields.join(", ")}
     where id = $1
       and owner_id = $2`,
    values,
  )
}

export async function deleteLibrary(id: string, ownerId: string): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `delete from libraries
     where id = $1
       and owner_id = $2
     returning id`,
    [id, ownerId],
  )

  return rows.length > 0
}
