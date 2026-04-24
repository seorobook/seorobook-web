import 'server-only';

import { query } from './db';

/**
 * Assets DAL — one row per placeable pixel-art sprite.
 *
 * Phase 1: every public asset is free. Editing rights gated by author_id.
 */

export type AssetRow = {
  id: string;
  slug: string;
  kind: 'object' | 'background' | 'character';
  category: string;
  grid_w: number;
  grid_h: number;
  canvas_w: number;
  canvas_h: number;
  max_frames: number;
  frame_count: number;
  author_id: string | null;
  origin: 'official' | 'user';
  visibility: 'private' | 'public';
  png_url: string | null;
  piskel_url: string | null;
  sha256: string | null;
  label: string;
  created_at: string;
  updated_at: string;
};

/** Single lookup by slug. Returns null if missing. */
export async function getAssetBySlug(slug: string): Promise<AssetRow | null> {
  const { rows } = await query<AssetRow>(
    `select * from assets where slug = $1`,
    [slug],
  );
  return rows[0] ?? null;
}

/**
 * Batch-fetch: all slugs the caller's room might reference.
 * Returns a Map keyed by slug, with missing slugs simply absent.
 */
export async function getAssetsBySlugs(slugs: string[]): Promise<Map<string, AssetRow>> {
  if (slugs.length === 0) return new Map();
  const { rows } = await query<AssetRow>(
    `select * from assets where slug = any($1::text[])`,
    [slugs],
  );
  return new Map(rows.map((r) => [r.slug, r]));
}

/**
 * Catalog browse for a given user: official + public user assets +
 * the user's own private drafts. Grouped by category in memory.
 */
export async function listAssetsForUser(userId: string | null): Promise<AssetRow[]> {
  const { rows } = await query<AssetRow>(
    `select * from assets
      where visibility = 'public'
         or author_id = $1
      order by origin desc, category asc, created_at asc`,
    [userId],
  );
  return rows;
}

/**
 * Can this user place this asset in their own room?
 *   · official          → yes
 *   · user + public     → yes
 *   · user + private    → only if author
 */
export function canUseAsset(asset: AssetRow, userId: string): boolean {
  if (asset.visibility === 'public') return true;
  return asset.author_id === userId;
}

/** Only the author can edit. Official assets are locked (author_id = null). */
export function canEditAsset(asset: AssetRow, userId: string): boolean {
  return asset.author_id != null && asset.author_id === userId;
}
