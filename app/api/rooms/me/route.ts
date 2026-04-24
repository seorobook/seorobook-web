import { NextResponse } from 'next/server';

import { getRoomManifest } from '@/data/rooms';
import { auth } from '@/lib/auth';

/**
 * GET /api/rooms/me
 *
 * Auth-derived convenience endpoint. Returns the caller's compiled room
 * manifest. getRoomManifest seeds STARTER_LAYOUT for new users, so the
 * response is always renderable.
 */
export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const manifest = await getRoomManifest(session.user.id);

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}
