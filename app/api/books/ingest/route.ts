import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Catalog ingest moved to `seorobook-server` (FastAPI) so Next.js does not mix
 * session auth with batch/NDL/Blob work. Use:
 * POST {server}/v1/catalog/ingest with header `x-seoro-ingest-token`.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "gone",
      message:
        "Book catalog ingest is handled by seorobook-server. Use POST /v1/catalog/ingest (or /v1/catalog/seed/samples) with x-seoro-ingest-token.",
    },
    { status: 410 },
  )
}
