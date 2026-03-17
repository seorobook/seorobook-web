import { query } from "./db"

export type ReviewRow = {
  id: string
  user_id: string
  book_id: string
  content: string
  visibility: "private" | "public" | "sero"
  created_at: string
}

export async function listReviewsByBookId(bookId: string): Promise<ReviewRow[]> {
  const { rows } = await query<ReviewRow>(
    `select id, user_id, book_id, content, visibility, created_at
     from reviews
     where book_id = $1
     order by created_at desc`,
    [bookId],
  )
  return rows
}

/** 내가 볼 수 있는 리뷰만 (본인 책 + visibility 허용). 여기서는 본인 책의 리뷰만 반환. */
export async function listReviewsByBookIdForUser(
  bookId: string,
  userId: string,
): Promise<ReviewRow[]> {
  const { rows } = await query<ReviewRow>(
    `select r.id, r.user_id, r.book_id, r.content, r.visibility, r.created_at
     from reviews r
     join books b on b.id = r.book_id
     where r.book_id = $1 and b.user_id = $2
     order by r.created_at desc`,
    [bookId, userId],
  )
  return rows
}

export async function getReviewById(id: string): Promise<ReviewRow | null> {
  const { rows } = await query<ReviewRow>(
    `select id, user_id, book_id, content, visibility, created_at
     from reviews
     where id = $1
     limit 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function createReview(
  userId: string,
  bookId: string,
  content: string,
  visibility: "private" | "public" | "sero" = "private",
): Promise<ReviewRow> {
  const { rows } = await query<ReviewRow>(
    `insert into reviews (user_id, book_id, content, visibility)
     values ($1, $2, $3, $4)
     returning id, user_id, book_id, content, visibility, created_at`,
    [userId, bookId, content.trim(), visibility],
  )
  return rows[0]
}

export async function updateReviewVisibility(
  id: string,
  userId: string,
  visibility: "private" | "public" | "sero",
): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `update reviews set visibility = $3 where id = $1 and user_id = $2 returning id`,
    [id, userId, visibility],
  )
  return rows.length > 0
}

export async function deleteReview(id: string, userId: string): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `delete from reviews where id = $1 and user_id = $2 returning id`,
    [id, userId],
  )
  return rows.length > 0
}
