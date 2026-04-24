import { NextResponse } from 'next/server';

import { getRoomManifest } from '@/data/rooms';

/**
 * Public manifest read. Mobile + guests use this to view someone's room.
 * getRoomManifest falls back to STARTER_LAYOUT when the user has no row,
 * so callers always get a renderable manifest.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const manifest = await getRoomManifest(userId);

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
