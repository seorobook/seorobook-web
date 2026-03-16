import { query } from "./db"

export type VisitedRealm = {
  id: string
  name: string
  share_id: string
}

export async function listVisitedRealms(userId: string): Promise<VisitedRealm[]> {
  const { rows } = await query<VisitedRealm>(
    `select r.id, r.name, r.share_id
     from profiles p
     join lateral unnest(p.visited_realms) as v(share_id) on true
     join realms r on r.share_id = v.share_id
     where p.id = $1`,
    [userId],
  )
  return rows
}

export async function addVisitedRealm(userId: string, shareId: string): Promise<void> {
  await query(
    `update profiles
     set visited_realms = case
       when visited_realms is null then array[ $2 ]
       when $2 = any(visited_realms) then visited_realms
       else visited_realms || $2
     end
     where id = $1`,
    [userId, shareId],
  )
}

