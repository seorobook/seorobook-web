import 'server-only';

import {
  compileManifest,
  EMPTY_LAYOUT,
  STARTER_LAYOUT,
  type RoomLayout,
  type RoomManifest,
} from '@/lib/rooms/manifest';

import { getAssetsBySlugs } from './assets';
import { query } from './db';

/**
 * Rooms DAL.
 *
 * The `rooms` table (migration 005) stores:
 *   layout_json    — editor source of truth (Placement[] etc.)
 *   manifest_json  — compiled mobile view (pre-rendered for fast GET)
 *
 * The editor writes both on save so readers don't have to compile on
 * every request. Read paths fall back to on-the-fly compile when rows
 * pre-date the current compiler.
 */

type RoomRow = {
  layout_json: RoomLayout | null;
  manifest_json: RoomManifest | null;
};

/** Raw layout. If the user has no saved row yet, seed with STARTER_LAYOUT. */
export async function getRoomLayout(userId: string): Promise<RoomLayout> {
  const { rows } = await query<RoomRow>(
    `select layout_json, manifest_json from rooms where owner_id = $1`,
    [userId],
  );
  const saved = rows[0]?.layout_json;
  if (saved && saved.version === 1 && Array.isArray(saved.placements)) {
    return saved;
  }
  return STARTER_LAYOUT;
}

/** Manifest read used by mobile + public viewers. */
export async function getRoomManifest(userId: string): Promise<RoomManifest> {
  const { rows } = await query<RoomRow>(
    `select layout_json, manifest_json from rooms where owner_id = $1`,
    [userId],
  );
  const row = rows[0];

  // Prefer the pre-compiled manifest when present.
  if (row?.manifest_json && row.manifest_json.version === 1) {
    return row.manifest_json;
  }

  const layout =
    row?.layout_json && row.layout_json.version === 1 ? row.layout_json : STARTER_LAYOUT;

  const slugs = Array.from(new Set(layout.placements.map((p) => p.slug)));
  const assets = await getAssetsBySlugs(slugs);
  return compileManifest(layout, assets);
}

/** Upsert a layout + its compiled manifest. Caller must validate layout first. */
export async function saveRoom(userId: string, layout: RoomLayout): Promise<RoomManifest> {
  const slugs = Array.from(new Set(layout.placements.map((p) => p.slug)));
  const assets = await getAssetsBySlugs(slugs);
  const manifest = compileManifest(layout, assets);

  await query(
    `insert into rooms (owner_id, layout_json, manifest_json, compiled_at, updated_at)
     values ($1, $2::jsonb, $3::jsonb, now(), now())
     on conflict (owner_id) do update set
       layout_json = excluded.layout_json,
       manifest_json = excluded.manifest_json,
       compiled_at = excluded.compiled_at,
       updated_at = excluded.updated_at`,
    [userId, JSON.stringify(layout), JSON.stringify(manifest)],
  );

  return manifest;
}

export { EMPTY_LAYOUT };
