/**
 * Isometric math — pure functions, no side effects.
 *
 * Shared between:
 *   · Pixi preview (client): draws the grid + placements.
 *   · compile.ts (server):   renders the same layout to a flat PNG.
 *   · save validator:        bounds + footprint overlap checks.
 *
 * Convention
 * ──────────
 *   Tile coord (tx, ty) with tx ∈ [0, gridW), ty ∈ [0, gridH).
 *   Tile (0, 0) is the BACK of the room (farthest from camera).
 *   Tile (gridW-1, gridH-1) is the FRONT-RIGHT corner.
 *
 *   Screen projection (2:1 isometric):
 *     screenX = originX + (tx - ty) * (tileW / 2)
 *     screenY = originY + (tx + ty) * (tileH / 2)
 *
 *   Depth sort (painter's algorithm): larger (tx + ty) = closer to camera
 *   → draw later.
 */

/** Default tile size for the seorobook room. 2:1 ratio is the iso classic. */
export const TILE_W = 64;
export const TILE_H = 32;

/** Default room grid — 8×8 feels right for a cozy mini-hompy. */
export const DEFAULT_GRID_W = 8;
export const DEFAULT_GRID_H = 8;

export type IsoOrigin = { x: number; y: number };

export type IsoLayout = {
  gridW: number;
  gridH: number;
  tileW: number;
  tileH: number;
  origin: IsoOrigin;
};

/** Build an iso layout centered horizontally inside a frame. */
export function centeredIsoLayout(
  frameW: number,
  frameH: number,
  opts: {
    gridW?: number;
    gridH?: number;
    tileW?: number;
    tileH?: number;
    /** Vertical position of the top of the diamond, 0..1 of frameH. */
    topRatio?: number;
  } = {},
): IsoLayout {
  const gridW = opts.gridW ?? DEFAULT_GRID_W;
  const gridH = opts.gridH ?? DEFAULT_GRID_H;
  const tileW = opts.tileW ?? TILE_W;
  const tileH = opts.tileH ?? TILE_H;

  // The diamond's topmost point is at tile (0, 0) → screenX = originX.
  // We want that horizontally centered: originX = frameW / 2.
  const originX = frameW / 2;

  // Place the diamond's top at a configurable vertical ratio.
  const originY = Math.round(frameH * (opts.topRatio ?? 0.42));

  return { gridW, gridH, tileW, tileH, origin: { x: originX, y: originY } };
}

/** Center of a tile (tx, ty) in screen pixels. */
export function tileCenter(l: IsoLayout, tx: number, ty: number): { x: number; y: number } {
  return {
    x: l.origin.x + (tx - ty) * (l.tileW / 2),
    y: l.origin.y + (tx + ty) * (l.tileH / 2),
  };
}

/**
 * Screen-space diamond polygon for tile (tx, ty).
 * Vertices: top, right, bottom, left (clockwise).
 */
export function tileDiamond(l: IsoLayout, tx: number, ty: number): [number, number][] {
  const c = tileCenter(l, tx, ty);
  const hw = l.tileW / 2;
  const hh = l.tileH / 2;
  return [
    [c.x,      c.y - hh],
    [c.x + hw, c.y     ],
    [c.x,      c.y + hh],
    [c.x - hw, c.y     ],
  ];
}

/** Bounding box of the full floor diamond in screen pixels. */
export function floorBounds(l: IsoLayout): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  // Leftmost point: tile (0, gridH-1) → screenX = originX - (gridH-1) * tileW/2
  // Rightmost:      tile (gridW-1, 0)
  // Top:            tile (0, 0)
  // Bottom:         tile (gridW-1, gridH-1)
  const topC = tileCenter(l, 0, 0);
  const botC = tileCenter(l, l.gridW - 1, l.gridH - 1);
  const leftC = tileCenter(l, 0, l.gridH - 1);
  const rightC = tileCenter(l, l.gridW - 1, 0);
  return {
    minX: leftC.x - l.tileW / 2,
    maxX: rightC.x + l.tileW / 2,
    minY: topC.y - l.tileH / 2,
    maxY: botC.y + l.tileH / 2,
  };
}

/**
 * Convert a pointer hit (sx, sy) back to tile coords.
 *
 * Inverse of tileCenter, then snapped to the nearest tile. Returns null
 * if the hit is outside the grid.
 */
export function screenToTile(
  l: IsoLayout,
  sx: number,
  sy: number,
): { tx: number; ty: number } | null {
  // Solve:
  //   sx - originX = (tx - ty) * tileW/2
  //   sy - originY = (tx + ty) * tileH/2
  // → tx = (sx' / (tileW/2) + sy' / (tileH/2)) / 2
  //   ty = (sy' / (tileH/2) - sx' / (tileW/2)) / 2
  const sxp = sx - l.origin.x;
  const syp = sy - l.origin.y;
  const a = sxp / (l.tileW / 2);
  const b = syp / (l.tileH / 2);
  const tx = Math.round((a + b) / 2);
  const ty = Math.round((b - a) / 2);
  if (tx < 0 || tx >= l.gridW || ty < 0 || ty >= l.gridH) return null;
  return { tx, ty };
}

/**
 * Check whether a footprint of size (fw, fh) anchored at (tx, ty) fits
 * entirely within the grid. The anchor is the back-left tile of the footprint.
 */
export function footprintInBounds(
  gridW: number,
  gridH: number,
  tx: number,
  ty: number,
  fw: number,
  fh: number,
): boolean {
  return (
    Number.isInteger(tx) &&
    Number.isInteger(ty) &&
    tx >= 0 &&
    ty >= 0 &&
    tx + fw <= gridW &&
    ty + fh <= gridH
  );
}

/**
 * Depth order: placements should be painted back-to-front. Items whose
 * footprint anchor (tx + ty) is larger appear "closer" → draw later.
 * Ties broken by insertion order via `idx` to keep it stable.
 */
export function depthKey(tx: number, ty: number, fw: number, fh: number, idx: number): number {
  // Use the footprint's front corner for depth.
  const frontX = tx + fw - 1;
  const frontY = ty + fh - 1;
  return (frontX + frontY) * 1000 + idx;
}
