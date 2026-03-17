import { query } from "./db"

export type BookRow = {
  id: string
  user_id: string
  title: string
  author: string | null
  read_at: string | null
  created_at: string
}

export async function listBooksByUserId(userId: string): Promise<BookRow[]> {
  const { rows } = await query<BookRow>(
    `select id, user_id, title, author, read_at, created_at
     from books
     where user_id = $1
     order by read_at desc nulls last, created_at desc`,
    [userId],
  )
  return rows
}

export async function getBookById(id: string): Promise<BookRow | null> {
  const { rows } = await query<BookRow>(
    `select id, user_id, title, author, read_at, created_at
     from books
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function createBook(
  userId: string,
  title: string,
  author: string | null,
  readAt: string | null,
): Promise<BookRow> {
  const { rows } = await query<BookRow>(
    `insert into books (user_id, title, author, read_at)
     values ($1, $2, $3, $4)
     returning id, user_id, title, author, read_at, created_at`,
    [userId, title.trim(), author?.trim() || null, readAt || null],
  )
  return rows[0]
}

export async function updateBook(
  id: string,
  userId: string,
  updates: { title?: string; author?: string | null; read_at?: string | null },
): Promise<boolean> {
  const fields: string[] = []
  const values: unknown[] = [id, userId]
  if (updates.title !== undefined) {
    fields.push(`title = $${values.length + 1}`)
    values.push(updates.title.trim())
  }
  if (updates.author !== undefined) {
    fields.push(`author = $${values.length + 1}`)
    values.push(updates.author?.trim() || null)
  }
  if (updates.read_at !== undefined) {
    fields.push(`read_at = $${values.length + 1}`)
    values.push(updates.read_at || null)
  }
  if (fields.length === 0) return true
  const { rows } = await query<{ id: string }>(
    `update books set ${fields.join(", ")} where id = $1 and user_id = $2 returning id`,
    values,
  )
  return rows.length > 0
}

export async function deleteBook(id: string, userId: string): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `delete from books where id = $1 and user_id = $2 returning id`,
    [id, userId],
  )
  return rows.length > 0
}
