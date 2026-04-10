import { query } from "./db"

export type CatalogContributorRole = "author" | "translator" | "illustrator" | "narrator"

export type CatalogContributorRow = {
  id: string
  name: string
  name_normalized: string | null
  created_at: string
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ")
}

export async function upsertCatalogContributor(name: string): Promise<CatalogContributorRow> {
  const n = normalizeName(name)
  if (!n) throw new Error("contributor name is required")
  const { rows } = await query<CatalogContributorRow>(
    `insert into catalog_contributors (name, name_normalized)
     values ($1, $2)
     on conflict (name)
     do update set name_normalized = excluded.name_normalized
     returning id, name, name_normalized, created_at`,
    [n, n.toLowerCase()],
  )
  return rows[0]
}

export async function setCatalogBookContributions(params: {
  bookId: string
  contributions: Array<{ name: string; role: CatalogContributorRole; position?: number | null }>
}): Promise<void> {
  // Simple MVP behavior: insert missing rows; do not delete existing.
  for (const c of params.contributions) {
    const contributor = await upsertCatalogContributor(c.name)
    await query(
      `insert into catalog_book_contributions (book_id, contributor_id, role, position)
       values ($1, $2, $3, $4)
       on conflict (book_id, contributor_id, role) do update set position = excluded.position`,
      [params.bookId, contributor.id, c.role, c.position ?? null],
    )
  }
}

