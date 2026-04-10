import { query } from "./db"

export type CatalogCoverSourceType = "api_isbn" | "api_search"

export async function setPrimaryCatalogCover(params: {
  bookId: string
  imageId: string
  sourceType: CatalogCoverSourceType
  sourceRef?: string | null
}): Promise<void> {
  await query(`update catalog_book_covers set is_primary = false where book_id = $1`, [params.bookId])
  await query(
    `insert into catalog_book_covers (book_id, image_id, source_type, source_ref, is_primary)
     values ($1, $2, $3, $4, true)
     on conflict (book_id, image_id)
     do update set source_type = excluded.source_type,
                   source_ref = excluded.source_ref,
                   is_primary = true`,
    [params.bookId, params.imageId, params.sourceType, params.sourceRef ?? null],
  )
}

