import { NextResponse } from 'next/server';

import { getAssetsBySlugs, canUseAsset } from '@/data/assets';
import { saveRoom } from '@/data/rooms';
import { auth } from '@/lib/auth';
import { footprintInBounds } from '@/lib/rooms/iso';
import { validateLayout } from '@/lib/rooms/manifest';

/**
 * POST /api/rooms/save
 * Body: { layout: RoomLayout }
 *
 * Validates structure, checks every placement slug resolves to an asset
 * the caller is allowed to use, checks footprints fit the grid, then
 * upserts layout + compiled manifest.
 */
export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let layout;
  try {
    layout = validateLayout((body as { layout?: unknown })?.layout);
  } catch (e) {
    return NextResponse.json(
      { error: 'invalid layout', detail: (e as Error).message },
      { status: 400 },
    );
  }

  // Resolve every slug against the assets catalog.
  const slugs = Array.from(new Set(layout.placements.map((p) => p.slug)));
  const assets = await getAssetsBySlugs(slugs);

  for (const p of layout.placements) {
    const asset = assets.get(p.slug);
    if (!asset) {
      return NextResponse.json({ error: `unknown asset: ${p.slug}` }, { status: 400 });
    }
    if (!canUseAsset(asset, userId)) {
      return NextResponse.json({ error: `asset not accessible: ${p.slug}` }, { status: 403 });
    }
    if (!footprintInBounds(layout.gridW, layout.gridH, p.tileX, p.tileY, asset.grid_w, asset.grid_h)) {
      return NextResponse.json(
        { error: `placement out of bounds: ${p.slug} @ (${p.tileX},${p.tileY})` },
        { status: 400 },
      );
    }
  }

  const manifest = await saveRoom(userId, layout);

  return NextResponse.json({ ok: true, manifest }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
