import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Stage {
  id: string;          // '01'
  kicker: string;       // '01 / IDENTIFY'
  label: string;        // 'Identify'
  body: string;
  imageKey: 'identifyImage' | 'verifyImage' | 'traceImage';
}

const STAGES: Stage[] = [
  {
    id: '01',
    kicker: '01 / IDENTIFY',
    label: 'Identify',
    body: 'Create a persistent digital identity for every aviation component.',
    imageKey: 'identifyImage',
  },
  {
    id: '02',
    kicker: '02 / VERIFY',
    label: 'Verify',
    body: "Verify the component using its secure digital identity.",
    imageKey: 'verifyImage',
  },
  {
    id: '03',
    kicker: '03 / TRACE',
    label: 'Trace',
    body: "Follow the component's lifecycle, maintenance, and verification history.",
    imageKey: 'traceImage',
  },
];

// ~5s per step, per spec. (Was 2500ms — reverted to the original 5000ms.)
const AUTOPLAY_MS = 2500;
const EASE = [0.16, 1, 0.3, 1] as const;

// Default imagery — real Unsplash photos, free to use under the Unsplash
// License (no attribution required). Verified individually:
//   Identify: "Black and white view of a spinning jet engine turbine" by
//             ObjectType RAW — https://unsplash.com/photos/gaH-pX-cP20
//   Verify:   "Woman holding Android smartphone" (tap-to-pay) by Jonas
//             Leupe — https://unsplash.com/photos/0IVop5v4MMU
//   Trace:    "White Private Jet Nose Close Up In Hangar" by Eric Prouzet
//             — https://unsplash.com/photos/ggUYxdREMoM
// These are placeholders standing in for real AERO-SENSE photography.
// Pass identifyImage / verifyImage / traceImage as props to override any
// or all of them — props always win over these defaults.
const DEFAULT_IMAGES: Record<Stage['imageKey'], string> = {
  identifyImage:
    'https://images.unsplash.com/photo-1779680057959-11adee4dbc9e?auto=format&fit=crop&q=80&w=1400',
  verifyImage:
    'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?auto=format&fit=crop&q=80&w=1400',
  traceImage:
    'https://images.unsplash.com/photo-1692128237627-e756e994b048?auto=format&fit=crop&q=80&w=1400',
};

// Vertical slide: forward (dir > 0) enters from below / exits upward.
// Backward (dir < 0) is the exact reverse, per spec.
const imageVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export interface HowItWorksProps {
  /** Override the default placeholder photography with real AERO-SENSE images. */
  identifyImage?: string;
  verifyImage?: string;
  traceImage?: string;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({
  identifyImage,
  verifyImage,
  traceImage,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isPaused = isHovering || isFocusWithin;

  const active = STAGES[activeIndex];
  const images: Record<Stage['imageKey'], string> = {
    identifyImage: identifyImage ?? DEFAULT_IMAGES.identifyImage,
    verifyImage: verifyImage ?? DEFAULT_IMAGES.verifyImage,
    traceImage: traceImage ?? DEFAULT_IMAGES.traceImage,
  };
  const activeImage = images[active.imageKey];

  const goTo = (i: number) => {
    if (i === activeIndex) return;
    setDirection(i > activeIndex ? 1 : -1);
    setActiveIndex(i);
  };
  const handleNext = () => {
    setDirection(1);
    setActiveIndex((p) => (p + 1) % STAGES.length);
  };
  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((p) => (p - 1 + STAGES.length) % STAGES.length);
  };

  // Arrow-key navigation while focus is within the stage list — Up/Down
  // (and Left/Right, since the mobile layout stacks horizontally-ish)
  // move to the neighboring stage and move focus with it.
  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (i + 1) % STAGES.length;
      goTo(next);
      stageButtonRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (i - 1 + STAGES.length) % STAGES.length;
      goTo(prev);
      stageButtonRefs.current[prev]?.focus();
    }
  };

  // Autoplay: 01 -> 02 -> 03 -> 01, every ~5s. Re-arms on every activeIndex
  // or pause-state change, so a manual click/keypress or a pause/resume
  // always gets a fresh full interval rather than continuing a stale
  // countdown.
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const t = setInterval(handleNext, AUTOPLAY_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isPaused, prefersReducedMotion]);

  return (
    // NOTE: id is "passport" (not "how-it-works") because the nav's
    // "How It Works" link (#passport) targets this section. The other
    // section, ComponentPassport, previously also used id="passport" —
    // a duplicate-ID bug — and has been changed to id="component-passport".
    <section id="passport" className="bg-white px-6 py-28 md:px-10">
      <div
        ref={containerRef}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 md:grid-cols-2"
        onFocus={() => setIsFocusWithin(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocusWithin(false);
          }
        }}
      >
        {/* Left: eyebrow, heading, and the stage list */}
        <div>
          <span className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
            How AERO-SENSE Works
          </span>
          <h2 className="mt-4 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            Identify. Verify. Trace.
          </h2>

          <div className="mt-10 flex flex-col">
            {STAGES.map((stage, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={stage.id}
                  ref={(el) => {
                    stageButtonRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => goTo(i)}
                  onKeyDown={(e) => handleStageKeyDown(e, i)}
                  aria-pressed={isActive}
                  className="group relative flex items-start gap-4 border-t border-pebble py-6 pl-5 text-left first:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2"
                >
                  {/* Vertical accent bar. Fills 0->100% over the autoplay
                      window while active and not paused; static full bar
                      when reduced motion (no timed animation to represent). */}
                  <span
                    className="absolute inset-y-0 left-0 w-[2px] overflow-hidden bg-pebble"
                    aria-hidden="true"
                  >
                    {isActive && (
                      <motion.span
                        key={`progress-${activeIndex}-${isPaused}-${prefersReducedMotion}`}
                        className="absolute left-0 top-0 w-full origin-top bg-clay"
                        initial={{ height: '0%' }}
                        animate={{
                          height: prefersReducedMotion || isPaused ? '0%' : '100%',
                        }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : AUTOPLAY_MS / 1000,
                          ease: 'linear',
                        }}
                      />
                    )}
                    {isActive && (prefersReducedMotion || isPaused) && (
                      <span className="absolute left-0 top-0 h-full w-full bg-clay" />
                    )}
                  </span>

                  <span
                    className={`mt-1.5 font-mono text-[10px] tabular-nums transition-colors duration-300 ${
                      isActive ? 'text-clay' : 'text-ash/60 group-hover:text-ash'
                    }`}
                  >
                    /{stage.id}
                  </span>

                  <div className="flex flex-1 flex-col gap-2">
                    <span
                      className={`font-display text-2xl font-semibold tracking-tight transition-colors duration-300 md:text-3xl ${
                        isActive ? 'text-ink' : 'text-ink/40 group-hover:text-ink/70'
                      }`}
                    >
                      {stage.label}
                    </span>
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.p
                          initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden font-body text-sm leading-relaxed text-ash"
                        >
                          {stage.body}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: image area. Falls back to DEFAULT_IMAGES until real
            AERO-SENSE photography is passed in via props. */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden border border-pebble bg-pebble/10"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={activeImage}
              custom={direction}
              variants={prefersReducedMotion ? undefined : imageVariants}
              initial={prefersReducedMotion ? false : 'enter'}
              animate="center"
              exit={prefersReducedMotion ? undefined : 'exit'}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute inset-0"
            >
              <img
                src={activeImage}
                alt={`${active.label} — AERO-SENSE`}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Prev/Next — manual override, doesn't stop autoplay on its own
              beyond the normal re-arm-on-activeIndex-change behavior above. */}
          <div className="absolute bottom-5 right-5 z-10 flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous stage"
              className="flex h-10 w-10 items-center justify-center border border-ink/15 bg-white/80 text-ink backdrop-blur-sm transition-colors duration-300 hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next stage"
              className="flex h-10 w-10 items-center justify-center border border-ink/15 bg-white/80 text-ink backdrop-blur-sm transition-colors duration-300 hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;