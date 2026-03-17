import { query } from "./db"

export type VisitRow = {
  id: string
  library_id: string
  host_id: string
  scheduled_at: string
  max_participants: number
  status: string
  created_at: string
}

export type VisitInviteeRow = {
  visit_id: string
  user_id: string
  status: string
  message: string | null
  responded_at: string | null
  created_at: string
}

export async function createVisit(params: {
  libraryId: string
  hostId: string
  scheduledAt: string
  maxParticipants?: number
}): Promise<VisitRow> {
  const max = Math.max(1, Math.min(params.maxParticipants ?? 2, 50))
  const { rows } = await query<VisitRow>(
    `insert into visits (library_id, host_id, scheduled_at, max_participants)
     values ($1, $2, $3, $4)
     returning id, library_id, host_id, scheduled_at, max_participants, status, created_at`,
    [params.libraryId, params.hostId, params.scheduledAt, max],
  )
  return rows[0]
}

export async function getVisitById(id: string): Promise<VisitRow | null> {
  const { rows } = await query<VisitRow>(
    `select id, library_id, host_id, scheduled_at, max_participants, status, created_at
     from visits
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function listVisitsByHostId(hostId: string): Promise<VisitRow[]> {
  const { rows } = await query<VisitRow>(
    `select id, library_id, host_id, scheduled_at, max_participants, status, created_at
     from visits
     where host_id = $1
     order by scheduled_at desc
     limit 50`,
    [hostId],
  )
  return rows
}

export async function upsertVisitInvitee(params: {
  visitId: string
  userId: string
  message?: string | null
}): Promise<VisitInviteeRow> {
  const { rows } = await query<VisitInviteeRow>(
    `insert into visit_invitees (visit_id, user_id, status, message)
     values ($1, $2, 'pending', $3)
     on conflict (visit_id, user_id)
     do update set message = excluded.message
     returning visit_id, user_id, status, message, responded_at, created_at`,
    [params.visitId, params.userId, params.message ?? null],
  )
  return rows[0]
}

export async function getVisitInvitee(params: {
  visitId: string
  userId: string
}): Promise<VisitInviteeRow | null> {
  const { rows } = await query<VisitInviteeRow>(
    `select visit_id, user_id, status, message, responded_at, created_at
     from visit_invitees
     where visit_id = $1 and user_id = $2
     limit 1`,
    [params.visitId, params.userId],
  )
  return rows[0] ?? null
}

export async function respondToVisitInvite(params: {
  visitId: string
  userId: string
  status: "accepted" | "rejected"
}): Promise<boolean> {
  const { rows } = await query<{ visit_id: string }>(
    `update visit_invitees
     set status = $3, responded_at = now()
     where visit_id = $1 and user_id = $2
     returning visit_id`,
    [params.visitId, params.userId, params.status],
  )
  return rows.length > 0
}

