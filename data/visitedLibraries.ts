import { query } from "./db"

export type VisitedLibrary = {
  id: string
  name: string
  share_id: string
}

export async function listVisitedLibraries(userId: string): Promise<VisitedLibrary[]> {
  const { rows } = await query<VisitedLibrary>(
    `select r.id, r.name, r.share_id
     from profiles p
     join lateral unnest(p.visited_library_share_ids) as v(share_id) on true
     join libraries r on r.share_id = v.share_id
     where p.id = $1`,
    [userId],
  )
  return rows
}

export async function addVisitedLibrary(userId: string, shareId: string): Promise<void> {
  await query(
    `update profiles
     set visited_library_share_ids = case
       when visited_library_share_ids is null then array[ $2 ]
       when $2 = any(visited_library_share_ids) then visited_library_share_ids
       else visited_library_share_ids || $2
     end
     where id = $1`,
    [userId, shareId],
  )
}
