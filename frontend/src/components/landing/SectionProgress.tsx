import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

// Only sections with a real `id` in the DOM can be tracked. As of this
// pass that's Solution, Digital Twin, Passport, Explorer, Traceability,
// Blockchain History, Aircraft Health, Analytics, Security, and Final
// CTA — Hero, ProblemSection, and CompanyAccessSection don't have ids
// yet. Add an id to a section and a matching entry here to bring it
// into the nav.
//
// `theme` controls dot/label contrast. All tracked sections now sit on
// a light background, so every entry uses the 'light' treatment.
const SECTIONS = [
  { id: 'solution', label: 'Solution', theme: 'light' },
  { id: 'digital-twin', label: 'Digital Twin', theme: 'light' },
  { id: 'passport', label: 'Passport', theme: 'light' },
  { id: 'component-explorer', label: 'Explorer', theme: 'light' },
  { id: 'traceability', label: 'Traceability', theme: 'light' },
  { id: 'blockchain-history', label: 'History', theme: 'light' },
  { id: 'aircraft-health', label: 'Health', theme: 'light' },
  { id: 'analytics', label: 'Analytics', theme: 'light' },
  { id: 'security', label: 'Security', theme: 'light' },
  { id: 'final-cta', label: 'Get Started', theme: 'light' },
] as const;

type Theme = (typeof SECTIONS)[number]['theme'];

const THEME_CLASSES: Record<Theme, { label: string; dotIdle: string; dotHover: string }> = {
  light: {
    label: 'text-ink/60',
    dotIdle: 'border-ink/30 bg-transparent',
    dotHover: 'group-hover:border-ink/60',
  },
};

export const SectionProgress: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    if (elements.length === 0) return;

    // Track each tracked section's visible ratio; whichever has the most
    // visibility within a narrow band around the vertical center wins.
    // A single shared observer keeps this cheap and avoids fighting with
    // any section's own internal scroll logic (e.g. TraceabilityTimeline's
    // useScroll-driven stage tracking).
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId: string | null = null;
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        setActiveId(bestId);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-45% 0px -45% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const activeTheme: Theme = SECTIONS.find((s) => s.id === activeId)?.theme ?? 'light';
  const theme = THEME_CLASSES[activeTheme];
  const visible = activeId !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Section progress"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-10"
        >
          <ul className="pointer-events-auto flex flex-col items-end gap-4">
            {SECTIONS.map((section) => {
              const isActive = activeId === section.id;
              return (
                <li key={section.id} className="flex items-center gap-3">
                  <span
                    className={`font-body text-[10px] uppercase tracking-[0.15em] transition-opacity duration-300 ${theme.label} ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {section.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-label={`Go to ${section.label} section`}
                    aria-current={isActive ? 'true' : undefined}
                    className="group relative flex h-6 w-6 items-center justify-center focus-visible:outline-none"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full border transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 ${theme.dotHover} ${
                        isActive ? 'scale-125 border-ink bg-ink' : theme.dotIdle
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default SectionProgress;