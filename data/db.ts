import { Pool, type QueryResultRow } from "pg"

let connectionString =
  process.env.SEORO_POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("Neon Postgres URL is not configured")
}

// Use verify-full to avoid pg future SSL semantics change (and silence warning)
connectionString = connectionString.replace(
  /([?&])sslmode=(?:prefer|require|verify-ca)(&|$)/i,
  "$1sslmode=verify-full$2",
)
if (!/sslmode=/i.test(connectionString)) {
  connectionString += (connectionString.includes("?") ? "&" : "?") + "sslmode=verify-full"
}

export const pool = new Pool({
  connectionString,
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(text, params)
    return { rows: result.rows }
  } catch (err: any) {
    if (err?.code === "3D000") {
      const dbName = (err?.message?.match(/database "([^"]+)"/) ?? [null, "?"])[1]
      throw new Error(
        `Database "${dbName}" does not exist. Check Neon Console: use the connection string for the correct project and ensure the database exists.`,
        { cause: err },
      )
    }
    throw err
  } finally {
    client.release()
  }
}

