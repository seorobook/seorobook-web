import { query } from "./db"

export type MeetupStatus = "waiting" | "reading" | "discussion" | "ended" | "cancelled"
export type MemberRole = "host" | "member" | "guest"

export type MeetupRow = {
  id: string
  host_id: string
  title: string
  status: MeetupStatus
  status_started_at: string | null
  invite_code: string | null
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export type MeetupMemberRow = {
  id: string
  meetup_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export type MeetupMemberBookRow = {
  meetup_member_id: string
  book_title: string
  author: string | null
  cover_url: string | null
  updated_at: string
}

export function generateInviteCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no O/0, I/1
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ""
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export async function createMeetup(params: {
  hostId: string
  title: string
  scheduledAt?: string | null
  inviteCode?: string | null
}): Promise<MeetupRow> {
  const title = params.title.trim()
  if (!title) throw new Error("title is required")

  const inviteCode = params.inviteCode ?? generateInviteCode()

  const { rows } = await query<MeetupRow>(
    `insert into meetups (host_id, title, status, status_started_at, invite_code, scheduled_at)
     values ($1, $2, 'waiting', now(), $3, $4)
     returning id, host_id, title, status, status_started_at, invite_code, scheduled_at, started_at, ended_at, created_at`,
    [params.hostId, title, inviteCode, params.scheduledAt ?? null],
  )
  const meetup = rows[0]

  await query(
    `insert into meetup_members (meetup_id, user_id, role)
     values ($1, $2, 'host')
     on conflict (meetup_id, user_id) do update set role = 'host'`,
    [meetup.id, params.hostId],
  )

  return meetup
}

export async function getActiveMeetupForHost(hostId: string): Promise<MeetupRow | null> {
  const { rows } = await query<MeetupRow>(
    `select id, host_id, title, status, status_started_at, invite_code, scheduled_at, started_at, ended_at, created_at
     from meetups
     where host_id = $1
       and status in ('waiting', 'reading', 'discussion')
     order by created_at desc
     limit 1`,
    [hostId],
  )
  return rows[0] ?? null
}

export async function getMeetupById(id: string): Promise<MeetupRow | null> {
  const { rows } = await query<MeetupRow>(
    `select id, host_id, title, status, status_started_at, invite_code, scheduled_at, started_at, ended_at, created_at
     from meetups
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function getMeetupByInviteCode(inviteCode: string): Promise<MeetupRow | null> {
  const code = inviteCode.trim().toUpperCase()
  const { rows } = await query<MeetupRow>(
    `select id, host_id, title, status, status_started_at, invite_code, scheduled_at, started_at, ended_at, created_at
     from meetups
     where invite_code = $1
     limit 1`,
    [code],
  )
  return rows[0] ?? null
}

export async function addMember(params: {
  meetupId: string
  userId: string
  role: MemberRole
}): Promise<MeetupMemberRow> {
  const { rows } = await query<MeetupMemberRow>(
    `insert into meetup_members (meetup_id, user_id, role)
     values ($1, $2, $3)
     on conflict (meetup_id, user_id)
     do update set role = excluded.role
     returning id, meetup_id, user_id, role, joined_at`,
    [params.meetupId, params.userId, params.role],
  )
  return rows[0]
}

export async function setMyBook(params: {
  meetupMemberId: string
  bookTitle: string
  author?: string | null
  coverUrl?: string | null
}): Promise<MeetupMemberBookRow> {
  const title = params.bookTitle.trim()
  if (!title) throw new Error("book_title is required")
  const author = (params.author ?? "").trim() || null
  const coverUrl = (params.coverUrl ?? "").trim() || null

  const { rows } = await query<MeetupMemberBookRow>(
    `insert into meetup_member_books (meetup_member_id, book_title, author, cover_url)
     values ($1, $2, $3, $4)
     on conflict (meetup_member_id)
     do update set book_title = excluded.book_title,
                   author = excluded.author,
                   cover_url = excluded.cover_url,
                   updated_at = now()
     returning meetup_member_id, book_title, author, cover_url, updated_at`,
    [params.meetupMemberId, title, author, coverUrl],
  )
  return rows[0]
}

export async function listMembersWithBooks(meetupId: string): Promise<
  Array<{
    member_id: string
    user_id: string
    role: MemberRole
    joined_at: string
    nickname: string
    kind: "member" | "guest"
    book_title: string | null
    author: string | null
    cover_url: string | null
    book_updated_at: string | null
  }>
> {
  type Row = {
    member_id: string
    user_id: string
    role: MemberRole
    joined_at: string
    nickname: string
    kind: "member" | "guest"
    book_title: string | null
    author: string | null
    cover_url: string | null
    book_updated_at: string | null
  }

  const { rows } = await query<Row>(
    `select
       mm.id as member_id,
       mm.user_id,
       mm.role,
       mm.joined_at,
       p.nickname,
       p.kind,
       b.book_title,
       b.author,
       b.cover_url,
       b.updated_at as book_updated_at
     from meetup_members mm
     join profiles p on p.id = mm.user_id
     left join meetup_member_books b on b.meetup_member_id = mm.id
     where mm.meetup_id = $1
     order by mm.joined_at asc`,
    [meetupId],
  )
  return rows
}

export async function getMemberId(params: { meetupId: string; userId: string }): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    `select id from meetup_members where meetup_id = $1 and user_id = $2 limit 1`,
    [params.meetupId, params.userId],
  )
  return rows[0]?.id ?? null
}

export async function updateMeetupStatus(params: {
  meetupId: string
  status: MeetupStatus
}): Promise<MeetupRow | null> {
  const status = params.status
  const { rows } = await query<MeetupRow>(
    `update meetups
     set status = $2,
         status_started_at = now(),
         started_at = case
           when $2 = 'reading' and started_at is null then now()
           else started_at
         end,
         ended_at = case when $2 = 'ended' and ended_at is null then now() else ended_at end
     where id = $1
     returning id, host_id, title, status, status_started_at, invite_code, scheduled_at, started_at, ended_at, created_at`,
    [params.meetupId, status],
  )
  return rows[0] ?? null
}

export async function removeMemberFromMeetup(params: {
  meetupId: string
  userId: string
}): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `delete from meetup_members
     where meetup_id = $1 and user_id = $2 and role <> 'host'
     returning id`,
    [params.meetupId, params.userId],
  )
  return !!rows[0]?.id
}

export async function removeGuestFromMeetup(params: {
  meetupId: string
  guestId: string
}): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `delete from meetup_members mm
     using profiles p
     where mm.meetup_id = $1
       and mm.user_id = $2
       and mm.role = 'guest'
       and p.id = mm.user_id
       and p.kind = 'guest'
     returning mm.id as id`,
    [params.meetupId, params.guestId],
  )
  return !!rows[0]?.id
}

export async function cleanupExpiredGuests(): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `with expired_meetups as (
       select id from meetups
       where ended_at is not null
         and ended_at < now() - interval '24 hours'
     ),
     deleted_members as (
       delete from meetup_members mm
       using profiles p, expired_meetups em
       where mm.meetup_id = em.id
         and mm.user_id = p.id
         and p.kind = 'guest'
       returning mm.user_id
     ),
     deleted_profiles as (
       delete from profiles p
       where p.kind = 'guest'
         and not exists (select 1 from meetup_members mm where mm.user_id = p.id)
       returning p.id
     )
     select (select count(*) from deleted_members)::int as count`,
  )
  return rows[0]?.count ?? 0
}

