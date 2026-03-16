import { Pool } from "pg"

const connectionString =
  process.env.SEORO_POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("Neon Postgres URL is not configured")
}

export const pool = new Pool({
  connectionString,
})

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(text, params)
    return { rows: result.rows }
  } finally {
    client.release()
  }
}

