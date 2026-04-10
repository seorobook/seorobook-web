import { query } from "./db"

export type UserBookRow = {
  id: string
  user_id: string
  title: string
  isbn13: string | null
  pages: number | null
  language: string | null
  publisher: string | null
  publish_date: string | null
  book_type: string | null
  abstract: string | null
  is_series: boolean
  author_text: string | null
  translator_text: string | null
  illustrator_text: string | null
  narrator_text: string | null
  created_at: string
  updated_at: string
}

export async function createUserBook(params: {
  userId: string
  title: string
  isbn13?: string | null
  pages?: number | null
  language?: string | null
  publisher?: string | null
  publishDate?: string | null
  bookType?: string | null
  abstract?: string | null
  isSeries?: boolean
  authorText?: string | null
  translatorText?: string | null
  illustratorText?: string | null
  narratorText?: string | null
}): Promise<UserBookRow> {
  const title = params.title.trim()
  if (!title) throw new Error("title is required")

  const { rows } = await query<UserBookRow>(
    `insert into user_books (
      user_id, title, isbn13, pages, language, publisher, publish_date, book_type, abstract, is_series,
      author_text, translator_text, illustrator_text, narrator_text
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    returning
      id, user_id, title, isbn13, pages, language, publisher, publish_date, book_type, abstract, is_series,
      author_text, translator_text, illustrator_text, narrator_text, created_at, updated_at`,
    [
      params.userId,
      title,
      params.isbn13?.trim() || null,
      params.pages ?? null,
      params.language?.trim() || null,
      params.publisher?.trim() || null,
      params.publishDate ?? null,
      params.bookType?.trim() || null,
      params.abstract?.trim() || null,
      params.isSeries ?? false,
      params.authorText?.trim() || null,
      params.translatorText?.trim() || null,
      params.illustratorText?.trim() || null,
      params.narratorText?.trim() || null,
    ],
  )
  return rows[0]
}

export async function setPrimaryUserBookCover(params: {
  userBookId: string
  imageId: string
  addedByUserId: string
}): Promise<void> {
  await query(`update user_book_covers set is_primary = false where user_book_id = $1`, [params.userBookId])
  await query(
    `insert into user_book_covers (user_book_id, image_id, added_by_user_id, is_primary)
     values ($1, $2, $3, true)
     on conflict (user_book_id, image_id)
     do update set added_by_user_id = excluded.added_by_user_id,
                   is_primary = true`,
    [params.userBookId, params.imageId, params.addedByUserId],
  )
}

