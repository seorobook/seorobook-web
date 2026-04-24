/**
 * Category spec — the source of truth for "what size should a sprite
 * in category X be?"
 *
 *   · Piskel editor reads this to lock the canvas size.
 *   · Sprite upload validator reads this to reject off-spec PNGs.
 *   · Compile / Pixi reads this to render a placeholder silhouette
 *     when the DB row has no png_url yet.
 *
 * Dimensions are in the 64×32 tile system:
 *
 *   grid (footprint, in tiles)  — how many tiles on the floor
 *   canvas (in pixels)          — authoring canvas for one frame
 *   maxFrames                   — upper bound for animation length
 *   placeholder polygon (unit space [-0.5, 0.5]²) for pre-sprite preview
 */

export type SlotKind = 'object' | 'background' | 'character';

export type UnitShape = { kind: 'poly'; points: [number, number][] };

export type CategorySpec = {
  category: string;
  kind: SlotKind;
  gridW: number;
  gridH: number;
  canvasW: number;
  canvasH: number;
  maxFrames: number;
  /** Hard cap per room. undefined = unlimited. */
  maxPerRoom?: number;
  /** Placeholder silhouette until real pixel-art sprite ships. */
  placeholder: UnitShape;
  placeholderColor: string;
  /** Mobile-side slot kind (used for deep-link / UI routing). */
  mobileKind:
    | 'system:telescope'
    | 'system:butler'
    | 'system:me'
    | 'system:record'
    | 'companion:seat'
    | 'decor';
};

// ------------------------------------------------------------------
// Placeholder silhouettes — designed to read as silhouettes, not boxes.
// Kept here (not in manifest.ts) because they're category-level defaults.
// ------------------------------------------------------------------

const SHAPE_TELESCOPE: UnitShape = {
  // Tapered body with a solid splayed base — the old tripod shape had a
  // V-gap between its legs that sat *outside* the polygon, so taps in
  // that visually-central area missed the hit region.
  kind: 'poly',
  points: [
    [-0.12, -0.5], [0.12, -0.5], [0.15, -0.15], [0.08, 0.05],
    [0.42, 0.5],   [-0.42, 0.5], [-0.08, 0.05], [-0.15, -0.15],
  ],
};

const SHAPE_BUTLER: UnitShape = {
  kind: 'poly',
  points: [
    [-0.3, -0.15], [-0.15, -0.4], [0.15, -0.4], [0.3, -0.15],
    [0.3, 0.15],   [0.15, 0.4],   [-0.15, 0.4], [-0.3, 0.15],
  ],
};

const SHAPE_ME: UnitShape = {
  kind: 'poly',
  points: [
    [-0.13, -0.5], [0.13, -0.5], [0.18, -0.25], [0.45, -0.08],
    [0.5, 0.5],    [-0.5, 0.5],  [-0.45, -0.08], [-0.18, -0.25],
  ],
};

const SHAPE_RECORD: UnitShape = {
  kind: 'poly',
  points: [
    [-0.5, -0.5], [0.5, -0.5], [0.5, 0.2], [0.42, 0.5],
    [-0.42, 0.5], [-0.5, 0.2],
  ],
};

const SHAPE_SEAT: UnitShape = {
  kind: 'poly',
  points: [
    [-0.45, -0.25], [-0.35, -0.5], [0.35, -0.5], [0.45, -0.25],
    [0.5, 0.3],     [0.35, 0.5],   [-0.35, 0.5], [-0.5, 0.3],
  ],
};

// ------------------------------------------------------------------
// Category registry. Only shipped categories appear here; user-authored
// assets must pick one of these as their `category`.
// ------------------------------------------------------------------

export const CATEGORY_SPEC: Record<string, CategorySpec> = {
  telescope: {
    category: 'telescope',
    kind: 'object',
    gridW: 1, gridH: 2,
    canvasW: 64, canvasH: 128,
    maxFrames: 8,
    maxPerRoom: 1,
    placeholder: SHAPE_TELESCOPE,
    placeholderColor: '#c9d4ce',
    mobileKind: 'system:telescope',
  },
  butler: {
    category: 'butler',
    kind: 'character',
    gridW: 1, gridH: 1,
    canvasW: 64, canvasH: 64,
    maxFrames: 16,
    maxPerRoom: 1,
    placeholder: SHAPE_BUTLER,
    placeholderColor: '#7adfbb',
    mobileKind: 'system:butler',
  },
  me: {
    category: 'me',
    kind: 'character',
    gridW: 1, gridH: 1,
    canvasW: 64, canvasH: 96,
    maxFrames: 8,
    maxPerRoom: 1,
    placeholder: SHAPE_ME,
    placeholderColor: '#f4a259',
    mobileKind: 'system:me',
  },
  record: {
    category: 'record',
    kind: 'object',
    gridW: 2, gridH: 1,
    canvasW: 128, canvasH: 48,
    maxFrames: 1,
    maxPerRoom: 1,
    placeholder: SHAPE_RECORD,
    placeholderColor: '#8b5e3c',
    mobileKind: 'system:record',
  },
  seat: {
    category: 'seat',
    kind: 'object',
    gridW: 1, gridH: 1,
    canvasW: 64, canvasH: 64,
    maxFrames: 4,
    placeholder: SHAPE_SEAT,
    placeholderColor: '#2e6d53',
    mobileKind: 'companion:seat',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_SPEC);

export function getCategorySpec(category: string): CategorySpec | null {
  return CATEGORY_SPEC[category] ?? null;
}
