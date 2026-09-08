import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const SECTIONS = [
  { id: 'solution', label: 'Solution' },
  { id: 'digital-twin', label: 'Digital Twin' },
  { id: 'component-passport', label: 'Passport' },
  { id: 'passport', label: 'How It Works' },
  { id: 'traceability', label: 'Traceability' },
  { id: 'security', label: 'Security' },
  { id: 'final-cta', label: 'Get Started' },
] as const;

export const SectionProgress: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => element !== null
    );
    if (!elements.length) return;

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

    elements.forEach((element) => observer.observe(element));
    observerRef.current = observer;
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <AnimatePresence>
      {activeId && (
        <motion.nav
          aria-label="Section progress"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-10"
        >
          <ul className="pointer-events-auto flex flex-col items-end gap-3">
            {SECTIONS.map((section) => {
              const isActive = activeId === section.id;
              return (
                <li key={section.id} className="flex items-center gap-3">
                  <span className={`font-body text-[10px] uppercase tracking-[0.15em] text-accent transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    {section.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-label={`Go to ${section.label} section`}
                    aria-current={isActive ? 'true' : undefined}
                    className="group relative flex h-6 w-6 items-center justify-center focus-visible:outline-none"
                  >
                    <span className={`h-2 w-2 rounded-full border transition-all duration-300 ${isActive ? 'scale-125 border-accent bg-accent shadow-[0_0_0_4px_rgba(79,70,229,.10)]' : 'border-ink/20 bg-white group-hover:border-accent/50'}`} />
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
