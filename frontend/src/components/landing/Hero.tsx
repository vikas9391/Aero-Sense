import React, { useCallback, useEffect, useRef } from 'react';
import { motion, useTransform, useScroll, useReducedMotion } from 'framer-motion';
import { frameSrc, useFrameCache, type FrameSequenceConfig } from '../../lib/useCinematicFrames';

// Sequence 1: Aircraft -> Engine (drives 0-50% of hero scroll progress)
const AIRCRAFT: FrameSequenceConfig = { path: '/cinematic/aircraft', count: 120 };
// Sequence 2: Engine -> NFC tag (drives 50-100%)
// NOTE: inspect the tail of this sequence in your actual export. If the
// last few frames drift back to a wider engine composition instead of
// holding the tightest NFC close-up, lower this count so playback stops
// on the strongest close-up frame instead of the literal last file.
const NFC: FrameSequenceConfig = { path: '/cinematic/nfc', count: 120 };

// Frames kept warm around the current position, per sequence.
const PRELOAD_RADIUS = 8;
// Total scroll distance the pinned hero consumes, in viewport heights.
// Bigger = slower/more deliberate scrub through aircraft -> engine -> NFC.
const SCROLL_DISTANCE_VH = 380;
// Final slice of scroll progress reserved for holding on the last NFC
// frame — playback must finish BEFORE the pinned section releases, not
// exactly at release, so the "Verified" moment has room to land.
const NFC_HOLD_ZONE = 0.08;

// Secondary numbered-label layer. Purely a scroll-progress readout —
// decorative, does not gate or replace anything else in the frame.
const STAGE_LABELS = ['01/AIRCRAFT', '02/ENGINE', '03/NFC', '04/VERIFIED'] as const;

export const Hero: React.FC = () => {
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

  // -----------------------------------------------------------------
  // Typography choreography — driven directly off scrollYProgress via
  // useTransform, the same way the frame loop reads it via RAF: no
  // React state, no re-renders. Framer applies these to the DOM style
  // directly through the motion.div bindings below.
  // -----------------------------------------------------------------
  const trustOpacity = useTransform(scrollYProgress, [0.08, 0.14, 0.27, 0.32], [0, 1, 1, 0]);
  const trustY = useTransform(scrollYProgress, [0.08, 0.14, 0.27, 0.32], [24, 0, 0, -18]);

  const verifyOpacity = useTransform(scrollYProgress, [0.32, 0.4, 0.55, 0.63], [0, 1, 1, 0]);
  const verifyY = useTransform(scrollYProgress, [0.32, 0.4, 0.55, 0.63], [24, 0, 0, -18]);

  const labelOpacity = useTransform(scrollYProgress, [0.68, 0.74, 0.82, 0.87], [0, 1, 1, 0]);
  const labelY = useTransform(scrollYProgress, [0.68, 0.74, 0.82, 0.87], [16, 0, 0, -10]);

  const verifiedOpacity = useTransform(scrollYProgress, [0.85, 0.92, 1], [0, 1, 1]);
  const verifiedY = useTransform(scrollYProgress, [0.85, 0.92], [20, 0]);
  const verifiedScale = useTransform(scrollYProgress, [0.85, 0.92], [0.97, 1]);

  // -----------------------------------------------------------------
  // "Scroll to Explore" affordance — visible only at the very start of
  // the pinned section, gone well before the first headline fades in
  // (trustOpacity starts at 0.08), so the two never overlap in time.
  // -----------------------------------------------------------------
  const scrollPromptOpacity = useTransform(scrollYProgress, [0, 0.02, 0.05], [1, 1, 0]);
  const scrollPromptY = useTransform(scrollYProgress, [0, 0.05], [0, 8]);

  // -----------------------------------------------------------------
  // Numbered stage stepper (01/AIRCRAFT -> 04/VERIFIED). A single
  // motion value maps progress to a stage index in quarter-width
  // bands, with a short crossfade at each boundary; per-label opacity
  // then just asks "am I the active one". No React state involved.
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // Verification pulse — one subtle bump, not a loop. It happens
  // exactly once per scroll pass because it's tied to a fixed progress
  // window right where "✓ Verified" lands, not to a timer.
  // -----------------------------------------------------------------
  const verifiedPulseScale = useTransform(scrollYProgress, [0.9, 0.93, 0.97], [1, 1.15, 1]);
  const verifiedGlowOpacity = useTransform(scrollYProgress, [0.9, 0.93, 0.97], [0, 0.55, 0]);

  // -----------------------------------------------------------------
  // Frame resolution + canvas draw — same approach as the prior
  // CinematicScroll: 0-50% -> aircraft, 50-100% -> nfc, hard cut at the
  // matched boundary frame. The nfc side reserves its final slice of
  // progress as a pure hold: playback completes at (1 - NFC_HOLD_ZONE)
  // and idx clamps to the last frame from there to 1.0, so the canvas
  // freezes well before the section unpins.
  // -----------------------------------------------------------------
  const resolveFrame = useCallback((p: number) => {
    const clamped = Math.min(1, Math.max(0, p));
    if (clamped < 0.5) {
      const idx = Math.round((clamped / 0.5) * (AIRCRAFT.count - 1));
      return { cfg: AIRCRAFT, other: NFC, idx, otherBoundary: 0 };
    }
    const playEnd = 1 - NFC_HOLD_ZONE;
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
      // Not decoded yet — kick off the load, and in the meantime show
      // the nearest frame we do have so the canvas never goes blank.
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

  // First frame on screen as fast as possible, then warm a small batch.
  useEffect(() => {
    if (prefersReducedMotion) return;
    load(frameSrc(AIRCRAFT, 0));
    preload(AIRCRAFT, 0, 12);
  }, [load, preload, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <HeroStillFallback />;
  }

  return (
    <section
      ref={wrapperRef}
      className="relative w-full bg-[var(--color-sky)]"
      style={{ height: `${SCROLL_DISTANCE_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* Legibility scrim — the frame sequence swings from a near-white
            sky/aircraft shot to a near-black engine close-up, so white
            text needs guaranteed contrast independent of which frame is
            currently drawn. Fixed gradients (not tied to scroll) sitting
            behind the text layer, in front of the canvas. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-32 bg-gradient-to-b from-[var(--color-ink)]/55 to-transparent md:h-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-80 bg-gradient-to-t from-[var(--color-ink)]/75 via-[var(--color-ink)]/35 to-transparent md:h-[28rem]"
        />

        {/* Typography layer — secondary to the frame sequence. Positioned
            low and right, echoing the original hero's right-aligned
            headline, so it reads as a caption on the scene rather than a
            panel competing with it. */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-6 pb-16 md:px-12 md:pb-20">
          <motion.h2
            style={{ opacity: trustOpacity, y: trustY }}
            className="ml-auto max-w-[85vw] text-right font-display font-bold text-white sm:max-w-sm lg:max-w-lg"
          >
            <span
              style={{
                fontSize: 'clamp(2.25rem, 4.5vw, 63px)',
                lineHeight: 1,
                letterSpacing: '-1.26px',
                textShadow: '0 2px 24px rgba(0,13,16,0.45)',
              }}
            >
              Trust Every
              <br />
              Component.
            </span>
          </motion.h2>

          <motion.h2
            style={{ opacity: verifyOpacity, y: verifyY, position: 'absolute', right: '1.5rem', bottom: '4rem' }}
            className="ml-auto max-w-[85vw] text-right font-display font-bold text-white sm:max-w-sm lg:max-w-lg md:right-12"
          >
            <span
              style={{
                fontSize: 'clamp(2.25rem, 4.5vw, 63px)',
                lineHeight: 1,
                letterSpacing: '-1.26px',
                textShadow: '0 2px 24px rgba(0,13,16,0.45)',
              }}
            >
              Verify Every
              <br />
              Identity.
            </span>
          </motion.h2>

          <motion.p
            style={{ opacity: labelOpacity, y: labelY, position: 'absolute', left: '1.5rem', bottom: '2.5rem' }}
            className="font-body uppercase text-white/90 md:left-12"
          >
            <span style={{ fontSize: '13px', letterSpacing: '2.6px' }}>Physical Identity</span>
          </motion.p>

          <motion.div
            style={{ opacity: verifiedOpacity, y: verifiedY, scale: verifiedScale }}
            className="absolute inset-x-0 bottom-20 flex justify-center md:bottom-24"
          >
            {/* Pulse glow — a single soft radial bump timed to the
                "Verified" moment, sitting behind the checkmark text. */}
            <motion.span
              aria-hidden="true"
              style={{
                opacity: verifiedGlowOpacity,
                scale: verifiedPulseScale,
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
              }}
              className="pointer-events-none absolute h-24 w-24 rounded-full md:h-28 md:w-28"
            />
            <span
              className="font-display font-bold text-white"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 40px)',
                letterSpacing: '-0.6px',
                textShadow: '0 2px 24px rgba(0,13,16,0.5)',
              }}
            >
              ✓ Verified
            </span>
          </motion.div>
        </div>

        {/* Numbered stage stepper — secondary layer, decorative readout
            of scroll progress through aircraft -> engine -> NFC ->
            verified. Does not gate anything; purely informational. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-6 z-10 flex items-center justify-center gap-4 px-6 md:top-10 md:justify-start md:px-12"
        >
          {STAGE_LABELS.map((label, i) => (
            <motion.span
              key={label}
              style={{ opacity: stageOpacities[i], fontSize: '11px', letterSpacing: '2px' }}
              className="font-body uppercase text-white"
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Scroll-to-explore affordance — only visible before scrolling
            begins, gone well before any headline starts fading in. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: scrollPromptOpacity, y: scrollPromptY }}
          className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center md:bottom-10"
        >
          <span
            className="font-body uppercase text-white/90"
            style={{ fontSize: '12px', letterSpacing: '2px' }}
          >
            Scroll to Explore ↓
          </span>
        </motion.div>

        <p className="sr-only">
          Animated sequence: an aircraft in flight, transitioning into a close-up of its engine,
          revealing a secure NFC identity tag mounted on the component — verifying the component's
          digital identity.
        </p>
      </div>
    </section>
  );
};

// prefers-reduced-motion: no pinning, no scroll-jacking, no frame
// playback — a single stable frame with the full headline stack shown
// at once, sized like a normal section.
const HeroStillFallback: React.FC = () => {
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
    <section className="relative flex min-h-[620px] w-full items-end overflow-hidden md:min-h-[720px] lg:min-h-[88vh]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-2/3 bg-gradient-to-t from-[var(--color-ink)]/75 via-[var(--color-ink)]/30 to-transparent"
      />
      <div className="relative z-10 w-full px-6 pb-16 md:px-12 md:pb-20">
        <h2
          className="ml-auto max-w-[85vw] text-right font-display font-bold text-white sm:max-w-sm lg:max-w-lg"
          style={{
            fontSize: 'clamp(2.25rem, 4.5vw, 63px)',
            lineHeight: 1,
            letterSpacing: '-1.26px',
            textShadow: '0 2px 24px rgba(0,13,16,0.45)',
          }}
        >
          Trust Every Component.
          <br />
          Verify Every Identity.
        </h2>
        <p
          className="mt-3 ml-auto max-w-sm text-right font-body text-white/90"
          style={{ fontSize: '14px', letterSpacing: '1.5px' }}
        >
          PHYSICAL IDENTITY &nbsp;·&nbsp; ✓ VERIFIED
        </p>
      </div>
      <p className="sr-only">
        An aircraft engine with a secure NFC identity tag mounted on it, representing AERO-SENSE's
        digital component identity.
      </p>
    </section>
  );
};

export default Hero;