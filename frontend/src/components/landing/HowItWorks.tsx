import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Cpu, Fingerprint, GitBranch, ShieldCheck } from 'lucide-react';

interface Stage {
  id: string;
  kicker: string;
  label: string;
  body: string;
  icon: React.ElementType;
}

const STAGES: Stage[] = [
  {
    id: '01',
    kicker: '01 / IDENTIFY',
    label: 'Identify',
    body: 'Create a persistent digital identity for every aviation component.',
    icon: Fingerprint,
  },
  {
    id: '02',
    kicker: '02 / VERIFY',
    label: 'Verify',
    body: 'Verify the component using its secure digital identity.',
    icon: ShieldCheck,
  },
  {
    id: '03',
    kicker: '03 / TRACE',
    label: 'Trace',
    body: "Follow the component's lifecycle, maintenance, and verification history.",
    icon: GitBranch,
  },
];

const AUTOPLAY_MS = 2500;
const EASE = [0.16, 1, 0.3, 1] as const;

const imageVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export interface HowItWorksProps {}

export const HowItWorks: React.FC<HowItWorksProps> = () => {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isPaused = isHovering || isFocusWithin;
  const active = STAGES[activeIndex];

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

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const t = setInterval(handleNext, AUTOPLAY_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isPaused, prefersReducedMotion]);

  return (
    <section id="passport" className="bg-[var(--bg-app)] px-6 py-28 md:px-10">
      <div
        ref={containerRef}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 rounded-[2rem] border border-indigo-100/80 bg-white/75 p-6 shadow-[0_24px_80px_rgba(79,70,229,0.08)] backdrop-blur-xl md:grid-cols-2 md:gap-16 md:p-10 lg:p-12"
        onFocus={() => setIsFocusWithin(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) setIsFocusWithin(false);
        }}
      >
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
            How AERO-SENSE Works
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-[3.5rem]">
            Identify. Verify. Trace.
          </h2>
          <p className="mt-5 max-w-lg font-body text-base leading-relaxed text-ash">
            A simple physical-to-digital workflow keeps component identity and lifecycle context connected.
          </p>

          <div className="mt-10 flex flex-col">
            {STAGES.map((stage, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={stage.id}
                  ref={(el) => { stageButtonRefs.current[i] = el; }}
                  type="button"
                  onClick={() => goTo(i)}
                  onKeyDown={(e) => handleStageKeyDown(e, i)}
                  aria-pressed={isActive}
                  className="group relative flex items-start gap-4 border-t border-pebble py-6 pl-5 text-left first:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2"
                >
                  <span className="absolute inset-y-0 left-0 w-[2px] overflow-hidden bg-pebble" aria-hidden="true">
                    {isActive && (
                      <motion.span
                        key={`progress-${activeIndex}-${isPaused}-${prefersReducedMotion}`}
                        className="absolute left-0 top-0 w-full origin-top bg-gradient-to-b from-indigo-500 via-blue-500 to-violet-500"
                        initial={{ height: '0%' }}
                        animate={{ height: prefersReducedMotion || isPaused ? '0%' : '100%' }}
                        transition={{ duration: prefersReducedMotion ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                      />
                    )}
                    {isActive && (prefersReducedMotion || isPaused) && (
                      <span className="absolute left-0 top-0 h-full w-full bg-indigo-500" />
                    )}
                  </span>
                  <span className={`mt-1.5 font-mono text-[10px] tabular-nums transition-colors ${isActive ? 'text-indigo-600' : 'text-ash/60 group-hover:text-ash'}`}>
                    /{stage.id}
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <span className={`font-display text-2xl font-semibold tracking-tight transition-colors md:text-3xl ${isActive ? 'text-ink' : 'text-ink/40 group-hover:text-ink/70'}`}>
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

        <div
          className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] border border-indigo-100 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.18),transparent_42%),linear-gradient(145deg,#f8faff,#eef2ff)] shadow-inner"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(79,70,229,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={active.id}
              custom={direction}
              variants={prefersReducedMotion ? undefined : imageVariants}
              initial={prefersReducedMotion ? false : 'enter'}
              animate="center"
              exit={prefersReducedMotion ? undefined : 'exit'}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute inset-0 flex items-center justify-center p-8"
            >
              <div className="relative w-full max-w-md">
                <motion.div
                  animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, 0.5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative overflow-hidden rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_24px_60px_rgba(49,46,129,0.14)] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                        {React.createElement(active.icon, { className: 'h-5 w-5' })}
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-indigo-500">AERO-SENSE</div>
                        <div className="mt-1 font-display text-lg font-semibold text-ink">Digital identity</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-600">Active</span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {['Identity', 'NFC', 'History'].map((item, i) => (
                      <motion.div
                        key={item}
                        animate={prefersReducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                        transition={{ duration: 2.2, delay: i * 0.25, repeat: Infinity }}
                        className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-4 text-center"
                      >
                        <div className="font-mono text-[9px] uppercase tracking-wider text-indigo-500">{item}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-indigo-100"><span className="block h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" /></div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-white/80 px-4 py-3">
                    <Cpu className="h-4 w-4 text-indigo-500" />
                    <div className="flex-1">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-ash">Current operation</div>
                      <div className="mt-1 text-sm font-medium text-ink">{active.label} component record</div>
                    </div>
                    <motion.span animate={prefersReducedMotion ? undefined : { scale: [1, 1.25, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="h-2 w-2 rounded-full bg-indigo-500" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-5 right-5 z-10 flex gap-2">
            <button type="button" onClick={handlePrev} aria-label="Previous stage" className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-white/85 text-ink shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleNext} aria-label="Next stage" className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-white/85 text-ink shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
