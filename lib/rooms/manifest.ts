/**
 * Room manifest — contract between web editor (writer) and viewers.
 *
 * Two layers:
 *   RoomLayout   — editor source of truth. integer tile coords + slug refs.
 *                  compact, validate-able, round-trippable through the DB.
 *   RoomManifest — mobile-facing compiled view. polygons in 0..1 space
 *                  over a portrait frame, optional compiled scene PNG.
 *
 * Sprite pixel art comes from the `assets` table (populated by external
 * pipeline: designer uploads / marketplace). This module only owns the
 * *layout* of those sprites on the iso floor and the compile step that
 * turns layout coords into mobile polygons.
 */

import type { AssetRow } from '@/data/assets';

import { getCategorySpec } from './category-spec';
import type { SlotKind as CategorySlotKind, UnitShape } from './category-spec';
import {
  centeredIsoLayout,
  DEFAULT_GRID_H,
  DEFAULT_GRID_W,
  depthKey,
  footprintInBounds,
  tileCenter,
  TILE_H,
  TILE_W,
} from './iso';

// Re-export category-spec primitives for one-import ergonomics.
export { CATEGORY_LIST, CATEGORY_SPEC, getCategorySpec } from './category-spec';
export type { CategorySpec, SlotKind as CategorySlotKindT, UnitShape } from './category-spec';

/**
 * Mobile-facing slot kind. Drives tap routing on the phone (e.g. tapping
 * the telescope slot opens the Solar System screen).
 */
export type MobileSlotKind =
  | 'system:telescope'
  | 'system:butler'
  | 'system:me'
  | 'system:record'
  | 'companion:seat'
  | 'decor';

/** Relative (0..1) polygon inside the portrait frame. Clockwise. */
export type HitPolygon = [number, number][];

export type ObjectSlot = {
  id: string;
  kind: MobileSlotKind;
  label: string;
  /** Tap polygon. Now traces the sprite silhouette, not a bbox. */
  polygon: HitPolygon;
  /** Fill color for the silhouette (matches category-spec placeholderColor). */
  fill: string;
};

/**
 * Floor tile diamond for mobile to draw behind slots. Lets us show a room
 * shape even before any PNG scene is compiled.
 */
export type FloorTile = {
  /** 4-point diamond polygon, relative [0,1] coords. */
  polygon: HitPolygon;
};

export type RoomManifest = {
  version: 1;
  /** Portrait aspect = w/h. Mobile uses this to size the rendering frame. */
  aspect: number;
  /** Compiled scene PNG URL. Null = no scene yet, show empty frame. */
  scene_url: string | null;
  /** Iso floor tiles (background). Empty array = no floor rendering. */
  floor: FloorTile[];
  slots: ObjectSlot[];
};

// ────────────────────────────────────────────────────────────────────
// Editor-side layout (DB's `layout_json` column mirrors this shape)
// ────────────────────────────────────────────────────────────────────

/**
 * One sprite dropped on the floor. Anchor = back-left tile of the
 * asset's footprint (matches iso depth-sort convention).
 */
export type Placement = {
  /** Stable id so edits don't collide on re-save. */
  id: string;
  /** Foreign-key into `assets.slug`. */
  slug: string;
  tileX: number;
  tileY: number;
};

export type RoomLayout = {
  version: 1;
  gridW: number;
  gridH: number;
  placements: Placement[];
};

export const EMPTY_LAYOUT: RoomLayout = {
  version: 1,
  gridW: DEFAULT_GRID_W,
  gridH: DEFAULT_GRID_H,
  placements: [],
};

/**
 * Fallback layout seeded into a user's room when they haven't saved one
 * yet. Designed to read like a real room: big furniture hugs the back
 * wall (망원경 tucked in the back-left corner, 기록 table spanning back-
 * right), the butler floats near center as a focal point, with the
 * reading chair and user character settled into the foreground.
 *
 * Tile convention: (0,0) = back-left (farthest from camera), (7,7) =
 * front-right. Slugs point at the 5 official seed assets (migration 006).
 */
export const STARTER_LAYOUT: RoomLayout = {
  version: 1,
  gridW: DEFAULT_GRID_W,
  gridH: DEFAULT_GRID_H,
  placements: [
    // Back wall: tall telescope in the corner, desk along the right edge.
    { id: 'starter-telescope', slug: 'telescope_classic', tileX: 0, tileY: 0 },
    { id: 'starter-record', slug: 'record_table', tileX: 5, tileY: 0 },
    // Mid-room: floating butler sphere as focal point.
    { id: 'starter-butler', slug: 'butler_sphere', tileX: 3, tileY: 3 },
    // Front: reading chair to the right, user character to the left.
    { id: 'starter-seat', slug: 'seat_armchair', tileX: 5, tileY: 5 },
    { id: 'starter-me', slug: 'me_character', tileX: 2, tileY: 6 },
  ],
};

/** Baseline empty manifest served when compile inputs are missing. */
export const BLANK_MANIFEST: RoomManifest = {
  version: 1,
  aspect: 375 / 812,
  scene_url: null,
  floor: [],
  slots: [],
};

// ────────────────────────────────────────────────────────────────────
// Compile: RoomLayout → RoomManifest
// ────────────────────────────────────────────────────────────────────

/**
 * Portrait reference canvas used to compute relative polygons.
 * REF_W tuned so the 8×8 iso diamond (512px wide at tile=64) fills ~85%
 * of the frame, matching the mobile home's intended "room fills screen"
 * feel.
 */
const REF_ASPECT = 375 / 812;
const REF_W = 600;
const REF_H = Math.round(REF_W / REF_ASPECT); // ~1299

/**
 * Turn a layout into a mobile-consumable manifest.
 *
 * Each placement becomes one ObjectSlot. The slot's polygon is the
 * bounding box of the sprite *as it sits on the floor* — canvas bottom
 * centered on the footprint's front tile bottom, normalized to 0..1 of
 * the reference portrait frame.
 *
 * Slots are emitted in painter's depth order (back → front) so a
 * naive mobile renderer that draws in order gets overlaps right.
 */
export function compileManifest(layout: RoomLayout, assetsBySlug: Map<string, AssetRow>): RoomManifest {
  const iso = centeredIsoLayout(REF_W, REF_H, {
    gridW: layout.gridW,
    gridH: layout.gridH,
    tileW: TILE_W,
    tileH: TILE_H,
    topRatio: 0.48,
  });

  // ── floor tiles (drawn behind objects) ───────────────────────────
  const floor: FloorTile[] = [];
  for (let ty = 0; ty < layout.gridH; ty++) {
    for (let tx = 0; tx < layout.gridW; tx++) {
      const c = tileCenter(iso, tx, ty);
      const hw = iso.tileW / 2;
      const hh = iso.tileH / 2;
      const poly: HitPolygon = [
        [c.x / REF_W, (c.y - hh) / REF_H],
        [(c.x + hw) / REF_W, c.y / REF_H],
        [c.x / REF_W, (c.y + hh) / REF_H],
        [(c.x - hw) / REF_W, c.y / REF_H],
      ];
      floor.push({ polygon: poly });
    }
  }

  // ── object slots (painter order back-to-front) ──────────────────
  const ordered = layout.placements
    .map((p, idx) => {
      const asset = assetsBySlug.get(p.slug);
      if (!asset) return null;
      return {
        p,
        asset,
        key: depthKey(p.tileX, p.tileY, asset.grid_w, asset.grid_h, idx),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.key - b.key);

  const slots: ObjectSlot[] = [];
  for (const { p, asset } of ordered) {
    const spec = getCategorySpec(asset.category);
    if (!spec) continue;

    if (!footprintInBounds(layout.gridW, layout.gridH, p.tileX, p.tileY, asset.grid_w, asset.grid_h)) {
      continue;
    }

    // Foot anchor = front tile bottom-center.
    const frontTx = p.tileX + (asset.grid_w - 1);
    const frontTy = p.tileY + (asset.grid_h - 1);
    const frontCenter = tileCenter(iso, frontTx, frontTy);
    const footY = frontCenter.y + iso.tileH / 2;
    const cx = frontCenter.x;
    const cy = footY - asset.canvas_h / 2;

    // Silhouette polygon: category-spec unit shape scaled to canvas size
    // and positioned at the foot anchor. Fallback = centered rectangle.
    const unit = spec.placeholder.points;
    const raw = unit.length >= 3
      ? unit.map<[number, number]>(([ux, uy]) => [cx + ux * asset.canvas_w, cy + uy * asset.canvas_h])
      : ([
          [cx - asset.canvas_w / 2, cy - asset.canvas_h / 2],
          [cx + asset.canvas_w / 2, cy - asset.canvas_h / 2],
          [cx + asset.canvas_w / 2, cy + asset.canvas_h / 2],
          [cx - asset.canvas_w / 2, cy + asset.canvas_h / 2],
        ] as [number, number][]);

    const polygon: HitPolygon = raw.map(([x, y]) => [x / REF_W, y / REF_H]);

    slots.push({
      id: p.id,
      kind: spec.mobileKind,
      label: asset.label,
      polygon,
      fill: spec.placeholderColor,
    });
  }

  return {
    version: 1,
    aspect: REF_ASPECT,
    scene_url: null, // PNG compile deferred — mobile renders polygons only for now.
    floor,
    slots,
  };
}

/**
 * Server-side validation before persisting a layout. Throws on invalid
 * input so route handlers can return 400s.
 */
export function validateLayout(input: unknown): RoomLayout {
  if (!input || typeof input !== 'object') throw new Error('layout must be an object');
  const l = input as Partial<RoomLayout>;
  if (l.version !== 1) throw new Error('unsupported layout version');
  if (!Number.isInteger(l.gridW) || !Number.isInteger(l.gridH)) {
    throw new Error('grid dimensions must be integers');
  }
  if ((l.gridW as number) < 1 || (l.gridW as number) > 32) throw new Error('gridW out of range');
  if ((l.gridH as number) < 1 || (l.gridH as number) > 32) throw new Error('gridH out of range');
  if (!Array.isArray(l.placements)) throw new Error('placements must be an array');
  if (l.placements.length > 64) throw new Error('too many placements');

  const seenIds = new Set<string>();
  const placements: Placement[] = [];
  for (const raw of l.placements) {
    if (!raw || typeof raw !== 'object') throw new Error('placement must be an object');
    const p = raw as Partial<Placement>;
    if (typeof p.id !== 'string' || p.id.length === 0 || p.id.length > 64) {
      throw new Error('placement.id invalid');
    }
    if (seenIds.has(p.id)) throw new Error('placement.id duplicated');
    seenIds.add(p.id);
    if (typeof p.slug !== 'string' || p.slug.length === 0 || p.slug.length > 64) {
      throw new Error('placement.slug invalid');
    }
    if (!Number.isInteger(p.tileX) || !Number.isInteger(p.tileY)) {
      throw new Error('placement coords must be integers');
    }
    placements.push({ id: p.id, slug: p.slug, tileX: p.tileX as number, tileY: p.tileY as number });
  }

  return {
    version: 1,
    gridW: l.gridW as number,
    gridH: l.gridH as number,
    placements,
  };
}

// Legacy type re-exports kept for modules that still import from here.
export type { CategorySlotKind as SlotKind };
export type { UnitShape as UnitShapeT };
