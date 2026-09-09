import React, { useCallback, useEffect, useRef } from 'react';
import { motion, useTransform, useScroll, useReducedMotion } from 'framer-motion';
import { frameSrc, useFrameCache, type FrameSequenceConfig } from '../../lib/useCinematicFrames';

// AeroX-style cinematic sequence adapted for AeroSense:
// aircraft -> NFC/component reveal -> verified state.
const AIRCRAFT: FrameSequenceConfig = { path: '/cinematic/aircraft', count: 120 };
const NFC: FrameSequenceConfig = { path: '/cinematic/nfc', count: 120 };
const PRELOAD_RADIUS = 10;
const SCROLL_DISTANCE_VH = 380;
const VERIFIED_HOLD_ZONE = 0.08;
const STAGE_LABELS = ['01/AIRCRAFT', '02/COMPONENT', '03/NFC', '04/VERIFIED'] as const;

export const Hero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { load, get, preload, evictAround } = useFrameCache();
  const progressRef = useRef(0);
  const lastDrawnSrcRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ['start start', 'end end'] });

  const trustOpacity = useTransform(scrollYProgress, [0.08, 0.14, 0.27, 0.32], [0, 1, 1, 0]);
  const trustY = useTransform(scrollYProgress, [0.08, 0.14, 0.27, 0.32], [24, 0, 0, -18]);
  const verifyOpacity = useTransform(scrollYProgress, [0.32, 0.4, 0.55, 0.63], [0, 1, 1, 0]);
  const verifyY = useTransform(scrollYProgress, [0.32, 0.4, 0.55, 0.63], [24, 0, 0, -18]);
  const labelOpacity = useTransform(scrollYProgress, [0.64, 0.7, 0.81, 0.87], [0, 1, 1, 0]);
  const labelY = useTransform(scrollYProgress, [0.64, 0.7, 0.81, 0.87], [16, 0, 0, -10]);
  const verifiedOpacity = useTransform(scrollYProgress, [0.84, 0.91, 1], [0, 1, 1]);
  const verifiedY = useTransform(scrollYProgress, [0.84, 0.91], [20, 0]);
  const verifiedScale = useTransform(scrollYProgress, [0.84, 0.91], [0.97, 1]);
  const scrollPromptOpacity = useTransform(scrollYProgress, [0, 0.02, 0.05], [1, 1, 0]);
  const scrollPromptY = useTransform(scrollYProgress, [0, 0.05], [0, 8]);
  const activeStage = useTransform(
    scrollYProgress,
    [0, 0.24, 0.26, 0.49, 0.51, 0.74, 0.76, 1],
    [0, 0, 1, 1, 2, 2, 3, 3]
  );
  const stage0Opacity = useTransform(activeStage, (v) => (Math.round(v) === 0 ? 1 : 0.35));
  const stage1Opacity = useTransform(activeStage, (v) => (Math.round(v) === 1 ? 1 : 0.35));
  const stage2Opacity = useTransform(activeStage, (v) => (Math.round(v) === 2 ? 1 : 0.35));
  const stage3Opacity = useTransform(activeStage, (v) => (Math.round(v) === 3 ? 1 : 0.35));
  const stageOpacities = [stage0Opacity, stage1Opacity, stage2Opacity, stage3Opacity];
  const verifiedPulseScale = useTransform(scrollYProgress, [0.9, 0.94, 0.98], [1, 1.15, 1]);
  const verifiedGlowOpacity = useTransform(scrollYProgress, [0.9, 0.94, 0.98], [0, 0.55, 0]);

  const resolveFrame = useCallback((p: number) => {
    const clamped = Math.min(1, Math.max(0, p));
    if (clamped < 0.5) {
      const idx = Math.round((clamped / 0.5) * (AIRCRAFT.count - 1));
      return { cfg: AIRCRAFT, other: NFC, idx, otherBoundary: 0 };
    }

    // Reserve the final portion for the verified hold, exactly like AeroX.
    const playEnd = 1 - VERIFIED_HOLD_ZONE;
    const playProgress = Math.min(1, (clamped - 0.5) / (playEnd - 0.5));
    const idx = Math.round(playProgress * (NFC.count - 1));
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
    let drawnSrc = targetSrc;

    if (!img) {
      load(targetSrc);

      // Keep the canvas alive while the requested frame decodes. Remember
      // the actual frame drawn so a late load can replace the fallback.
      for (let d = 1; d < cfg.count && !img; d++) {
        const previous = idx - d;
        const next = idx + d;
        if (previous >= 0) {
          const candidate = get(frameSrc(cfg, previous));
          if (candidate) {
            img = candidate;
            drawnSrc = frameSrc(cfg, previous);
            break;
          }
        }
        if (next < cfg.count) {
          const candidate = get(frameSrc(cfg, next));
          if (candidate) {
            img = candidate;
            drawnSrc = frameSrc(cfg, next);
            break;
          }
        }
      }
    }

    if (img && lastDrawnSrcRef.current !== drawnSrc) {
      drawFrame(img);
      lastDrawnSrcRef.current = drawnSrc;
    }

    preload(cfg, idx, PRELOAD_RADIUS);
    preload(other, otherBoundary, 8);
    evictAround(cfg, idx, other, otherBoundary);
  }, [resolveFrame, get, load, drawFrame, preload, evictAround]);

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
      lastDrawnSrcRef.current = null;
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

  useEffect(() => {
    if (prefersReducedMotion) return;
    load(frameSrc(AIRCRAFT, 0));
    preload(AIRCRAFT, 0, 16);
  }, [load, preload, prefersReducedMotion]);

  if (prefersReducedMotion) return <HeroStillFallback />;

  return (
    <section ref={wrapperRef} className="relative w-full bg-[var(--color-sky)]" style={{ height: `${SCROLL_DISTANCE_VH}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ transform: 'translateZ(0)' }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-36 bg-gradient-to-b from-white/30 via-white/8 to-transparent md:h-44" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-80 bg-gradient-to-t from-[var(--color-ink)]/75 via-[var(--color-ink)]/35 to-transparent md:h-[28rem]" />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-6 pb-16 md:px-12 md:pb-20">
          <motion.h2 style={{ opacity: trustOpacity, y: trustY }} className="ml-auto max-w-[85vw] text-right font-display font-bold text-white sm:max-w-sm lg:max-w-lg">
            <span style={{ fontSize: 'clamp(2.25rem, 4.5vw, 63px)', lineHeight: 1, letterSpacing: '-1.26px', textShadow: '0 2px 24px rgba(0,13,16,0.45)' }}>Trust Every<br />Component.</span>
          </motion.h2>

          <motion.h2 style={{ opacity: verifyOpacity, y: verifyY, position: 'absolute', right: '1.5rem', bottom: '4rem' }} className="ml-auto max-w-[85vw] text-right font-display font-bold text-white sm:max-w-sm lg:max-w-lg md:right-12">
            <span style={{ fontSize: 'clamp(2.25rem, 4.5vw, 63px)', lineHeight: 1, letterSpacing: '-1.26px', textShadow: '0 2px 24px rgba(0,13,16,0.45)' }}>Verify Every<br />Identity.</span>
          </motion.h2>

          <motion.p style={{ opacity: labelOpacity, y: labelY, position: 'absolute', left: '1.5rem', bottom: '2.5rem' }} className="font-body uppercase text-white/90 md:left-12">
            <span style={{ fontSize: '13px', letterSpacing: '2.6px', textShadow: '0 2px 12px rgba(0,13,16,0.5)' }}>Physical Identity</span>
          </motion.p>

          <motion.div style={{ opacity: verifiedOpacity, y: verifiedY, scale: verifiedScale }} className="absolute inset-x-0 bottom-20 flex justify-center md:bottom-24">
            <motion.span aria-hidden="true" style={{ opacity: verifiedGlowOpacity, scale: verifiedPulseScale, background: 'radial-gradient(circle, rgba(99,102,241,.42) 0%, rgba(37,99,235,.18) 35%, transparent 70%)' }} className="absolute h-40 w-40 rounded-full blur-2xl" />
            <div className="relative flex items-center gap-3 rounded-full border border-white/20 bg-ink/55 px-5 py-3 text-white shadow-2xl backdrop-blur-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold">✓</span>
              <span className="font-display text-lg font-semibold">Verified</span>
            </div>
          </motion.div>

          <motion.div style={{ opacity: scrollPromptOpacity, y: scrollPromptY }} className="absolute bottom-8 right-6 flex flex-col items-center gap-2 text-white/80 md:bottom-10 md:right-12">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur"><span className="text-lg">↓</span></span>
            <span className="font-body text-[10px] uppercase tracking-[0.18em]">Scroll to explore</span>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute left-6 top-28 z-20 flex items-center gap-4 md:left-12 md:top-32">
          {STAGE_LABELS.map((label, i) => (
            <motion.span key={label} style={{ opacity: stageOpacities[i] }} className="font-mono text-[10px] tracking-[0.16em] text-white drop-shadow-sm md:text-[11px]">{label}</motion.span>
          ))}
        </div>

        <p className="sr-only">Animated sequence: aircraft, component reveal, NFC identity tag, and final verified state.</p>
      </div>
    </section>
  );
};

const HeroStillFallback: React.FC = () => (
  <section className="relative flex min-h-screen items-end overflow-hidden bg-[var(--color-sky)] px-6 pb-16 md:px-12 md:pb-20">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-blue-100" />
    <div className="relative z-10 max-w-2xl">
      <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-accent">AERO-SENSE</span>
      <h1 className="mt-5 font-display text-5xl font-bold leading-none tracking-tight text-ink sm:text-7xl">Trust every component.<br />Verify every identity.</h1>
    </div>
  </section>
);

export default Hero;
