import { query } from "./db"

export type ImageRow = {
  id: string
  storage_provider: "vercel_blob"
  storage_key: string
  public_url: string | null
  content_type: string | null
  bytes: number | null
  width: number | null
  height: number | null
  created_at: string
}

export async function upsertImage(params: {
  provider: "vercel_blob"
  key: string
  publicUrl?: string | null
  contentType?: string | null
  bytes?: number | null
  width?: number | null
  height?: number | null
}): Promise<ImageRow> {
  const { rows } = await query<ImageRow>(
    `insert into images (storage_provider, storage_key, public_url, content_type, bytes, width, height)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (storage_provider, storage_key)
     do update set public_url = excluded.public_url,
                   content_type = excluded.content_type,
                   bytes = excluded.bytes,
                   width = excluded.width,
                   height = excluded.height
     returning id, storage_provider, storage_key, public_url, content_type, bytes, width, height, created_at`,
    [
      params.provider,
      params.key,
      params.publicUrl ?? null,
      params.contentType ?? null,
      params.bytes ?? null,
      params.width ?? null,
      params.height ?? null,
    ],
  )
  return rows[0]
}

