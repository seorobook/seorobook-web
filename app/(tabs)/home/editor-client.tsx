'use client';

import React, { useMemo, useState } from 'react';

import type { AssetRow } from '@/data/assets';
import {
  centeredIsoLayout,
  depthKey,
  footprintInBounds,
  screenToTile,
  tileCenter,
  tileDiamond,
  TILE_H,
  TILE_W,
} from '@/lib/rooms/iso';
import { getCategorySpec, type RoomLayout } from '@/lib/rooms/manifest';

/**
 * Room editor (client).
 *
 * Read-model:   a RoomLayout ({gridW, gridH, placements}).
 * Interaction:  pick an asset from the right-side palette → tap a tile
 *               on the iso floor to drop it. Tap an existing placement
 *               to pick it back up / delete it. Save writes to
 *               /api/rooms/save.
 *
 * Rendering:    SVG. One <g> per layer so it's cheap to rerender.
 *               No Pixi, no canvas — keeps HMR happy and auth'd pages
 *               stay server-first.
 */

const VIEW_W = 640;
const VIEW_H = 720;

type Props = {
  assets: AssetRow[];
  initialLayout: RoomLayout;
};

export function EditorClient({ assets, initialLayout }: Props) {
  const [layout, setLayout] = useState<RoomLayout>(initialLayout);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoverTile, setHoverTile] = useState<{ tx: number; ty: number } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const iso = useMemo(
    () =>
      centeredIsoLayout(VIEW_W, VIEW_H, {
        gridW: layout.gridW,
        gridH: layout.gridH,
        tileW: TILE_W,
        tileH: TILE_H,
        topRatio: 0.32,
      }),
    [layout.gridW, layout.gridH],
  );

  const assetsBySlug = useMemo(() => {
    const m = new Map<string, AssetRow>();
    for (const a of assets) m.set(a.slug, a);
    return m;
  }, [assets]);

  const selectedAsset = selectedSlug ? assetsBySlug.get(selectedSlug) ?? null : null;

  // ─── interactions ────────────────────────────────────────────────

  function onFloorClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const sy = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    const hit = screenToTile(iso, sx, sy);
    if (!hit) return;

    // Tap an existing placement (whose footprint covers this tile)
    // → pick it back up.
    const existing = findPlacementAt(layout, assetsBySlug, hit.tx, hit.ty);
    if (existing) {
      setLayout((l) => ({ ...l, placements: l.placements.filter((p) => p.id !== existing.id) }));
      setSelectedSlug(existing.slug);
      return;
    }

    if (!selectedAsset) return;

    if (!footprintInBounds(layout.gridW, layout.gridH, hit.tx, hit.ty, selectedAsset.grid_w, selectedAsset.grid_h)) {
      return;
    }

    // Enforce maxPerRoom (category-level).
    const spec = getCategorySpec(selectedAsset.category);
    if (spec?.maxPerRoom) {
      const count = layout.placements.filter((p) => {
        const a = assetsBySlug.get(p.slug);
        return a && a.category === selectedAsset.category;
      }).length;
      if (count >= spec.maxPerRoom) {
        setSaveMsg(`${spec.category}은(는) 방에 최대 ${spec.maxPerRoom}개`);
        return;
      }
    }

    setLayout((l) => ({
      ...l,
      placements: [
        ...l.placements,
        {
          id: cryptoRandomId(),
          slug: selectedAsset.slug,
          tileX: hit.tx,
          tileY: hit.ty,
        },
      ],
    }));
    setSaveMsg(null);
  }

  function onFloorMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const sy = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    setHoverTile(screenToTile(iso, sx, sy));
  }

  async function onSave() {
    setSaveState('saving');
    setSaveMsg(null);
    try {
      const res = await fetch('/api/rooms/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        setSaveState('error');
        setSaveMsg(body.detail ?? body.error ?? `HTTP ${res.status}`);
        return;
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (e) {
      setSaveState('error');
      setSaveMsg((e as Error).message);
    }
  }

  // ─── render ──────────────────────────────────────────────────────

  const orderedPlacements = useMemo(() => {
    return [...layout.placements]
      .map((p, idx) => {
        const asset = assetsBySlug.get(p.slug);
        if (!asset) return null;
        return { p, asset, key: depthKey(p.tileX, p.tileY, asset.grid_w, asset.grid_h, idx) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.key - b.key);
  }, [layout.placements, assetsBySlug]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ─── iso room ─────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0c1420] via-[#0f1b27] to-[#152520]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-full w-full cursor-crosshair select-none"
          onClick={onFloorClick}
          onMouseMove={onFloorMove}
          onMouseLeave={() => setHoverTile(null)}
        >
          {/* floor tiles */}
          <g>
            {Array.from({ length: layout.gridH }).flatMap((_, ty) =>
              Array.from({ length: layout.gridW }).map((__, tx) => {
                const pts = tileDiamond(iso, tx, ty)
                  .map(([x, y]) => `${x},${y}`)
                  .join(' ');
                const isHover = hoverTile && hoverTile.tx === tx && hoverTile.ty === ty;
                return (
                  <polygon
                    key={`t-${tx}-${ty}`}
                    points={pts}
                    fill={isHover ? '#1e3a3a' : '#16262a'}
                    stroke="#2a4040"
                    strokeWidth={1}
                  />
                );
              }),
            )}
          </g>

          {/* hover preview footprint */}
          {hoverTile && selectedAsset && (
            <FootprintOverlay
              iso={iso}
              tx={hoverTile.tx}
              ty={hoverTile.ty}
              fw={selectedAsset.grid_w}
              fh={selectedAsset.grid_h}
              valid={footprintInBounds(layout.gridW, layout.gridH, hoverTile.tx, hoverTile.ty, selectedAsset.grid_w, selectedAsset.grid_h)}
            />
          )}

          {/* placements */}
          <g>
            {orderedPlacements.map(({ p, asset }) => (
              <PlacementSprite
                key={p.id}
                iso={iso}
                tileX={p.tileX}
                tileY={p.tileY}
                asset={asset}
              />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-[#7a8a82]">
          <span className="font-mono">
            grid {layout.gridW}×{layout.gridH} · {layout.placements.length} placed
          </span>
          {hoverTile && (
            <span className="font-mono">
              tile ({hoverTile.tx},{hoverTile.ty})
            </span>
          )}
        </div>
      </div>

      {/* ─── palette ──────────────────────────────────────────── */}
      <aside className="flex w-full flex-col gap-3 lg:w-80">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7a8a82]">
            inventory
          </h3>
          <div className="flex max-h-[400px] flex-col gap-1.5 overflow-y-auto">
            {assets.map((a) => {
              const spec = getCategorySpec(a.category);
              const isSelected = selectedSlug === a.slug;
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setSelectedSlug(isSelected ? null : a.slug)}
                  className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                    isSelected
                      ? 'border-[#06d6a0] bg-[#06d6a0]/10'
                      : 'border-white/5 bg-black/20 hover:bg-black/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ background: spec?.placeholderColor ?? '#777' }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[#e5efe9]">
                        {a.label}
                      </div>
                      <div className="truncate font-mono text-[10px] text-[#7a8a82]">
                        {a.category} · {a.grid_w}×{a.grid_h}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {assets.length === 0 && (
              <div className="rounded border border-white/5 bg-black/20 p-4 text-center text-xs text-[#7a8a82]">
                자산이 아직 없어요.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-[#7a8a82] leading-relaxed">
          <p className="mb-2 font-semibold text-[#e5efe9]">사용법</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>오른쪽에서 자산 선택 → 왼쪽 타일 클릭해서 배치</li>
            <li>배치된 자산 위를 클릭하면 다시 인벤토리로 집어 올려짐</li>
            <li>같은 자산을 두 번 클릭하면 선택 해제</li>
            <li>각 카테고리 상한 (예: 망원경 1개)은 자동 차단</li>
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saveState === 'saving'}
            className="flex-1 rounded-lg bg-[#06d6a0] px-4 py-2.5 text-sm font-semibold text-[#0a1512] transition hover:bg-[#05b388] disabled:opacity-50"
          >
            {saveState === 'saving'
              ? '저장중…'
              : saveState === 'saved'
                ? '저장됨 ✓'
                : '내 방 저장'}
          </button>
          <button
            type="button"
            onClick={() => {
              setLayout((l) => ({ ...l, placements: [] }));
              setSelectedSlug(null);
            }}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-[#7a8a82] hover:bg-white/[0.04]"
          >
            비우기
          </button>
        </div>
        {saveMsg && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              saveState === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {saveMsg}
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── placement sprite (placeholder silhouette) ─────────────────────

function PlacementSprite({
  iso,
  tileX,
  tileY,
  asset,
}: {
  iso: ReturnType<typeof centeredIsoLayout>;
  tileX: number;
  tileY: number;
  asset: AssetRow;
}) {
  const spec = getCategorySpec(asset.category);
  const frontTx = tileX + (asset.grid_w - 1);
  const frontTy = tileY + (asset.grid_h - 1);
  const frontCenter = tileCenter(iso, frontTx, frontTy);
  const footY = frontCenter.y + iso.tileH / 2;
  const cx = frontCenter.x;
  const cy = footY - asset.canvas_h / 2;

  // Until real PNG sprites ship, draw placeholder unit-polygon from
  // the category spec, scaled to the canvas rectangle.
  if (spec?.placeholder?.kind === 'poly' && !asset.png_url) {
    const pts = spec.placeholder.points
      .map(([ux, uy]) => `${cx + ux * asset.canvas_w},${cy + uy * asset.canvas_h}`)
      .join(' ');
    return (
      <g>
        <polygon points={pts} fill={spec.placeholderColor} opacity={0.88} />
        <polygon points={pts} fill="none" stroke="#0a1512" strokeWidth={1.2} />
      </g>
    );
  }

  // Future: png_url support. Drop an SVG <image> here.
  return (
    <rect
      x={cx - asset.canvas_w / 2}
      y={cy - asset.canvas_h / 2}
      width={asset.canvas_w}
      height={asset.canvas_h}
      fill={spec?.placeholderColor ?? '#888'}
      opacity={0.6}
    />
  );
}

function FootprintOverlay({
  iso,
  tx,
  ty,
  fw,
  fh,
  valid,
}: {
  iso: ReturnType<typeof centeredIsoLayout>;
  tx: number;
  ty: number;
  fw: number;
  fh: number;
  valid: boolean;
}) {
  const tiles: React.ReactElement[] = [];
  for (let dx = 0; dx < fw; dx++) {
    for (let dy = 0; dy < fh; dy++) {
      const pts = tileDiamond(iso, tx + dx, ty + dy)
        .map(([x, y]) => `${x},${y}`)
        .join(' ');
      tiles.push(
        <polygon
          key={`fp-${dx}-${dy}`}
          points={pts}
          fill={valid ? '#06d6a0' : '#ff4f4f'}
          opacity={0.28}
          stroke={valid ? '#06d6a0' : '#ff4f4f'}
          strokeWidth={1.5}
        />,
      );
    }
  }
  return <g pointerEvents="none">{tiles}</g>;
}

// ─── helpers ──────────────────────────────────────────────────────

function findPlacementAt(
  layout: RoomLayout,
  assetsBySlug: Map<string, AssetRow>,
  tx: number,
  ty: number,
) {
  // Search front-to-back so the topmost sprite wins on overlap.
  const sorted = [...layout.placements]
    .map((p, idx) => {
      const a = assetsBySlug.get(p.slug);
      if (!a) return null;
      return { p, a, key: depthKey(p.tileX, p.tileY, a.grid_w, a.grid_h, idx) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.key - a.key);

  for (const { p, a } of sorted) {
    if (
      tx >= p.tileX &&
      tx < p.tileX + a.grid_w &&
      ty >= p.tileY &&
      ty < p.tileY + a.grid_h
    ) {
      return p;
    }
  }
  return null;
}

function cryptoRandomId(): string {
  // Next.js 16 / modern browser; safe fallback for SSR not needed here
  // (this component is client-only).
  return 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
