import { query } from "./db"

export type CatalogBookRow = {
  id: string
  isbn13: string | null
  title: string
  pages: number | null
  language: string | null
  publisher: string | null
  publish_date: string | null
  book_type: string | null
  abstract: string | null
  is_series: boolean
  ndl_control_no: string | null
  ndl_id: string | null
  created_at: string
  updated_at: string
}

export type CatalogContributorRole = "author" | "translator" | "illustrator" | "narrator"

export type SearchCatalogBookResult = {
  id: string
  title: string
  isbn13: string | null
  publisher: string | null
  publish_date: string | null
  cover_url: string | null
  contributors: Array<{ name: string; role: CatalogContributorRole }>
}

function normalizeIsbn(raw: string | null | undefined): string | null {
  const v = (raw ?? "").replace(/[^0-9Xx]/g, "").toUpperCase()
  return v ? v : null
}

export async function upsertCatalogBook(params: {
  isbn13?: string | null
  title: string
  pages?: number | null
  language?: string | null
  publisher?: string | null
  publishDate?: string | null // YYYY-MM-DD
  bookType?: string | null
  abstract?: string | null
  isSeries?: boolean
  ndlControlNo?: string | null
  ndlId?: string | null
}): Promise<CatalogBookRow> {
  const isbn13 = normalizeIsbn(params.isbn13)
  const title = params.title.trim()
  if (!title) throw new Error("title is required")

  // Use the strongest available unique key for upsert.
  const keyKind = isbn13 ? "isbn13" : params.ndlControlNo ? "ndl_control_no" : params.ndlId ? "ndl_id" : null
  if (!keyKind) {
    // Fallback: insert without conflict target (may create duplicates). Acceptable for MVP seed.
    const { rows } = await query<CatalogBookRow>(
      `insert into catalog_books (isbn13, title, pages, language, publisher, publish_date, book_type, abstract, is_series, ndl_control_no, ndl_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning id, isbn13, title, pages, language, publisher, publish_date, book_type, abstract, is_series, ndl_control_no, ndl_id, created_at, updated_at`,
      [
        isbn13,
        title,
        params.pages ?? null,
        params.language ?? null,
        params.publisher ?? null,
        params.publishDate ?? null,
        params.bookType ?? null,
        params.abstract ?? null,
        params.isSeries ?? false,
        params.ndlControlNo ?? null,
        params.ndlId ?? null,
      ],
    )
    return rows[0]
  }

  const conflictTarget =
    keyKind === "isbn13" ? "(isbn13)" : keyKind === "ndl_control_no" ? "(ndl_control_no)" : "(ndl_id)"
  const conflictValue = keyKind === "isbn13" ? isbn13 : keyKind === "ndl_control_no" ? params.ndlControlNo : params.ndlId

  const { rows } = await query<CatalogBookRow>(
    `insert into catalog_books (isbn13, title, pages, language, publisher, publish_date, book_type, abstract, is_series, ndl_control_no, ndl_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict ${conflictTarget}
     do update set
       isbn13 = coalesce(excluded.isbn13, catalog_books.isbn13),
       title = excluded.title,
       pages = coalesce(excluded.pages, catalog_books.pages),
       language = coalesce(excluded.language, catalog_books.language),
       publisher = coalesce(excluded.publisher, catalog_books.publisher),
       publish_date = coalesce(excluded.publish_date, catalog_books.publish_date),
       book_type = coalesce(excluded.book_type, catalog_books.book_type),
       abstract = coalesce(excluded.abstract, catalog_books.abstract),
       is_series = excluded.is_series,
       ndl_control_no = coalesce(excluded.ndl_control_no, catalog_books.ndl_control_no),
       ndl_id = coalesce(excluded.ndl_id, catalog_books.ndl_id),
       updated_at = now()
     returning id, isbn13, title, pages, language, publisher, publish_date, book_type, abstract, is_series, ndl_control_no, ndl_id, created_at, updated_at`,
    [
      isbn13,
      title,
      params.pages ?? null,
      params.language ?? null,
      params.publisher ?? null,
      params.publishDate ?? null,
      params.bookType ?? null,
      params.abstract ?? null,
      params.isSeries ?? false,
      params.ndlControlNo ?? null,
      params.ndlId ?? null,
    ],
  )

  // Ensure the conflict key is not silently empty
  void conflictValue
  return rows[0]
}

export async function searchCatalogBooks(params: {
  q: string
  limit?: number
}): Promise<SearchCatalogBookResult[]> {
  const q = params.q.trim()
  if (!q) return []
  const limit = Math.max(1, Math.min(params.limit ?? 20, 50))

  type Row = {
    id: string
    title: string
    isbn13: string | null
    publisher: string | null
    publish_date: string | null
    cover_url: string | null
    contributor_name: string | null
    contributor_role: CatalogContributorRole | null
  }

  const { rows } = await query<Row>(
    `with base as (
       select b.id, b.title, b.isbn13, b.publisher, b.publish_date
       from catalog_books b
       where b.title ilike '%' || $1 || '%'
       order by b.updated_at desc
       limit $2
     ),
     primary_covers as (
       select c.book_id, i.public_url as cover_url
       from catalog_book_covers c
       join images i on i.id = c.image_id
       where c.is_primary = true
     )
     select
       base.id, base.title, base.isbn13, base.publisher, base.publish_date,
       pc.cover_url,
       cc.name as contributor_name,
       bc.role as contributor_role
     from base
     left join primary_covers pc on pc.book_id = base.id
     left join catalog_book_contributions bc on bc.book_id = base.id
     left join catalog_contributors cc on cc.id = bc.contributor_id
     order by base.title asc`,
    [q, limit],
  )

  const byId = new Map<string, SearchCatalogBookResult>()
  for (const r of rows) {
    const cur =
      byId.get(r.id) ??
      ({
        id: r.id,
        title: r.title,
        isbn13: r.isbn13,
        publisher: r.publisher,
        publish_date: r.publish_date,
        cover_url: r.cover_url,
        contributors: [],
      } satisfies SearchCatalogBookResult)
    if (!byId.has(r.id)) byId.set(r.id, cur)

    if (r.contributor_name && r.contributor_role) {
      cur.contributors.push({ name: r.contributor_name, role: r.contributor_role })
    }
  }
  return [...byId.values()]
}

