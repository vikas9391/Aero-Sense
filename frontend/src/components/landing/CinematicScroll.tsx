import React, { useCallback, useEffect, useRef } from 'react';
import { useScroll, useReducedMotion } from 'framer-motion';
import { frameSrc, useFrameCache, type FrameSequenceConfig } from '../../lib/useCinematicFrames';

// Sequence 1: Aircraft -> Engine (drives the first half of scroll progress)
const AIRCRAFT: FrameSequenceConfig = { path: '/cinematic/aircraft', count: 120 };
// Sequence 2: Engine -> NFC tag (drives the second half)
const NFC: FrameSequenceConfig = { path: '/cinematic/nfc', count: 120 };

// Frames kept warm around the current position, per sequence.
const PRELOAD_RADIUS = 8;
// Total scroll distance the pinned section consumes, in viewport heights.
// Bigger = slower/more deliberate scrub. Kept modest for mobile.
const SCROLL_DISTANCE_VH = 380;

export const CinematicScroll: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { load, get, preload, evictAround } = useFrameCache();

  const progressRef = useRef(0);
  const lastDrawnSrcRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  });

  // 0..1 scroll progress -> { which sequence, which frame index }.
  // 0.5 is the exact handoff point: aircraft's last frame and nfc's first
  // frame were produced to match, so the cut there is seamless.
  const resolveFrame = useCallback((p: number) => {
    const clamped = Math.min(1, Math.max(0, p));
    if (clamped < 0.5) {
      const idx = Math.round((clamped / 0.5) * (AIRCRAFT.count - 1));
      return { cfg: AIRCRAFT, other: NFC, idx, otherBoundary: 0 };
    }
    const idx = Math.round(((clamped - 0.5) / 0.5) * (NFC.count - 1));
    return { cfg: NFC, other: AIRCRAFT, idx, otherBoundary: AIRCRAFT.count - 1 };
  }, []);

  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const { w, h } = sizeRef.current;
    if (!canvas || !ctx || !w || !h) return;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return;

    // object-fit: cover, centered, no distortion.
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  const render = useCallback(() => {
    const { cfg, other, idx, otherBoundary } = resolveFrame(progressRef.current);
    const targetSrc = frameSrc(cfg, idx);

    let img = get(targetSrc);
    if (!img) {
      // Not decoded yet — start loading it, and in the meantime show the
      // nearest frame we do have so the canvas never goes blank/black.
      load(targetSrc);
      for (let d = 1; d < cfg.count && !img; d++) {
        img = get(frameSrc(cfg, Math.max(0, idx - d))) || get(frameSrc(cfg, Math.min(cfg.count - 1, idx + d)));
      }
    }

    if (img && lastDrawnSrcRef.current !== targetSrc) {
      drawFrame(img);
      lastDrawnSrcRef.current = targetSrc;
    }

    preload(cfg, idx, PRELOAD_RADIUS);
    preload(other, otherBoundary, 6);
    evictAround(cfg, idx, other, otherBoundary);
  }, [resolveFrame, get, load, drawFrame, preload, evictAround]);

  // Drives the render loop off the scroll motion value. Reading via RAF
  // (rather than subscribing to React state) means scroll never triggers
  // a React re-render — only the canvas repaints.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const loop = () => {
      progressRef.current = scrollYProgress.get();
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollYProgress, render, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      sizeRef.current = { w, h };
      lastDrawnSrcRef.current = null; // force a redraw at the new size
      render();
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [render, prefersReducedMotion]);

  // Get the very first frame on screen as fast as possible, then warm a
  // small batch around it. The rest streams in as the user scrolls.
  useEffect(() => {
    if (prefersReducedMotion) return;
    load(frameSrc(AIRCRAFT, 0));
    preload(AIRCRAFT, 0, 12);
  }, [load, preload, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <CinematicStillFallback />;
  }

  return (
    <section
      ref={wrapperRef}
      className="relative w-full bg-[var(--color-sky)]"
      style={{ height: `${SCROLL_DISTANCE_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <p className="sr-only">
          Animated sequence: an aircraft in flight, transitioning into a close-up of its engine,
          revealing a secure NFC identity tag mounted on the component.
        </p>
      </div>
    </section>
  );
};

// prefers-reduced-motion: no pinning, no scroll-jacking — just the
// strongest stable NFC close-up frame, sized like a normal section.
const CinematicStillFallback: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const w = canvas.width;
        const h = canvas.height;
        const scale = Math.max(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      };
      img.src = frameSrc(NFC, NFC.count - 1);
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <section className="relative h-[70vh] w-full overflow-hidden bg-[var(--color-slate-elevated)]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <p className="sr-only">
        An aircraft engine with a secure NFC identity tag mounted on it, representing AERO-SENSE's
        digital component identity.
      </p>
    </section>
  );
};

export default CinematicScroll;