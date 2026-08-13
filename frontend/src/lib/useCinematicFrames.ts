import { useCallback, useRef } from 'react';

/**
 * Describes one JPEG frame sequence living under /public/cinematic/<name>/.
 * Filenames match the frames exactly as supplied (ezgif export naming) —
 * nothing gets renamed on disk.
 */
export interface FrameSequenceConfig {
  path: string;       // e.g. '/cinematic/aircraft'
  count: number;       // total frames, e.g. 120
  prefix?: string;      // filename prefix, default 'ezgif-frame-'
  padLength?: number;    // zero-pad width, default 3
  extension?: string;     // default 'jpg'
}

export function frameSrc(cfg: FrameSequenceConfig, index: number): string {
  const clamped = Math.min(Math.max(index, 0), cfg.count - 1);
  const padded = String(clamped + 1).padStart(cfg.padLength ?? 3, '0');
  const prefix = cfg.prefix ?? 'ezgif-frame-';
  const ext = cfg.extension ?? 'jpg';
  return `${cfg.path}/${prefix}${padded}.${ext}`;
}

// How many decoded frames to keep resident in memory at once (per side of
// the current position, roughly). Frames outside this window get evicted
// so scrolling through 240 full-res JPEGs doesn't balloon memory on mobile.
const CACHE_WINDOW = 24;

/**
 * Progressive, self-evicting frame cache shared by the cinematic canvas.
 * - load(): kicks off (or returns) an <img> for a given src.
 * - get(): returns the decoded image only if it's actually ready to draw.
 * - preload(): warms frames nearest to a center index first.
 * - evictAround(): frees frames far from the given "keep" set.
 */
export function useFrameCache() {
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());

  const load = useCallback((src: string): HTMLImageElement => {
    const existing = cache.current.get(src);
    if (existing) return existing;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    cache.current.set(src, img);
    return img;
  }, []);

  const get = useCallback((src: string): HTMLImageElement | null => {
    const img = cache.current.get(src);
    if (img && img.complete && img.naturalWidth > 0) return img;
    return null;
  }, []);

  const preload = useCallback(
    (cfg: FrameSequenceConfig, centerIndex: number, radius: number) => {
      for (let d = 0; d <= radius; d++) {
        const forward = centerIndex + d;
        const backward = centerIndex - d;
        if (forward < cfg.count) load(frameSrc(cfg, forward));
        if (d > 0 && backward >= 0) load(frameSrc(cfg, backward));
      }
    },
    [load]
  );

  // Keeps only frames within CACHE_WINDOW of centerIndex (in the active
  // sequence) plus a small buffer at the handoff boundary of the other
  // sequence, releasing everything else so the browser can reclaim the
  // decoded bitmap memory.
  //
  // Fix: previously this set `img.src = ''` on evicted images. An empty
  // string src is resolved against the current document URL, which in
  // some browsers fires a spurious network request to the page itself.
  // We don't need to touch `.src` at all — dropping our only reference
  // to the Image (deleting it from the cache Map) is enough for the
  // decoded bitmap to become garbage-collectable once the GC runs.
  const evictAround = useCallback(
    (activeCfg: FrameSequenceConfig, centerIndex: number, otherCfg: FrameSequenceConfig, otherBoundaryIndex: number) => {
      const keep = new Set<string>();
      for (let d = -CACHE_WINDOW; d <= CACHE_WINDOW; d++) {
        const i = centerIndex + d;
        if (i >= 0 && i < activeCfg.count) keep.add(frameSrc(activeCfg, i));
      }
      for (let d = -6; d <= 6; d++) {
        const i = otherBoundaryIndex + d;
        if (i >= 0 && i < otherCfg.count) keep.add(frameSrc(otherCfg, i));
      }
      for (const src of cache.current.keys()) {
        if (!keep.has(src)) {
          cache.current.delete(src);
        }
      }
    },
    []
  );

  return { load, get, preload, evictAround };
}