import { query } from "./db"

export type BookRecordStatus =
  | "finished"
  | "reading"
  | "re-reading"
  | "stopped reading"
  | "will be reading"

export type BookRecordRow = {
  id: string
  user_id: string
  catalog_book_id: string | null
  user_book_id: string | null
  status: BookRecordStatus
  progress_percent: number
  wishlist: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export async function createBookRecord(params: {
  userId: string
  catalogBookId?: string | null
  userBookId?: string | null
  status: BookRecordStatus
  progressPercent?: number | null
  wishlist?: boolean | null
  tags?: string[] | null
}): Promise<BookRecordRow> {
  const progress = Math.max(0, Math.min(100, Math.floor(params.progressPercent ?? 0)))
  const tags = Array.isArray(params.tags) ? params.tags.filter((t) => typeof t === "string" && t.trim()) : []

  const { rows } = await query<BookRecordRow>(
    `insert into book_records (user_id, catalog_book_id, user_book_id, status, progress_percent, wishlist, tags)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning id, user_id, catalog_book_id, user_book_id, status, progress_percent, wishlist, tags, created_at, updated_at`,
    [
      params.userId,
      params.catalogBookId ?? null,
      params.userBookId ?? null,
      params.status,
      progress,
      params.wishlist ?? false,
      tags,
    ],
  )
  return rows[0]
}

export async function updateBookRecord(params: {
  id: string
  userId: string
  status?: BookRecordStatus
  progressPercent?: number | null
  wishlist?: boolean
  tags?: string[] | null
}): Promise<BookRecordRow | null> {
  const fields: string[] = []
  const values: unknown[] = [params.id, params.userId]

  if (params.status !== undefined) {
    fields.push(`status = $${values.length + 1}`)
    values.push(params.status)
  }
  if (params.progressPercent !== undefined) {
    fields.push(`progress_percent = $${values.length + 1}`)
    values.push(Math.max(0, Math.min(100, Math.floor(params.progressPercent ?? 0))))
  }
  if (params.wishlist !== undefined) {
    fields.push(`wishlist = $${values.length + 1}`)
    values.push(params.wishlist)
  }
  if (params.tags !== undefined) {
    const tags = Array.isArray(params.tags) ? params.tags.filter((t) => typeof t === "string" && t.trim()) : []
    fields.push(`tags = $${values.length + 1}`)
    values.push(tags)
  }
  if (fields.length === 0) return null

  const { rows } = await query<BookRecordRow>(
    `update book_records
     set ${fields.join(", ")}, updated_at = now()
     where id = $1 and user_id = $2
     returning id, user_id, catalog_book_id, user_book_id, status, progress_percent, wishlist, tags, created_at, updated_at`,
    values,
  )
  return rows[0] ?? null
}

