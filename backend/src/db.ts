import { Pool, type QueryResultRow } from "pg"

const connectionString =
  process.env.BACKEND_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error(
    "BACKEND_DATABASE_URL (or DATABASE_URL/POSTGRES_URL) must be set for backend DB access",
  )
}

const pool = new Pool({ connectionString })

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = [],
) {
  return pool.query<T>(text, params)
}

