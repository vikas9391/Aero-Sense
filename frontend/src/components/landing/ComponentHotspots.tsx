import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Hotspot {
  id: string;
  label: string;
  description: string;
  /** Position as a percentage of the container, e.g. { top: '20%', left: '65%' } */
  top: string;
  left: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'identity',
    label: 'Digital Identity',
    description: 'A unique digital identity is assigned to the component.',
    top: '22%',
    left: '58%',
  },
  {
    id: 'authentication',
    label: 'Authentication',
    description: 'Confirms the component matches its registered identity.',
    top: '48%',
    left: '78%',
  },
  {
    id: 'traceability',
    label: 'Traceability',
    description: 'Its lifecycle and maintenance record stay attached.',
    top: '68%',
    left: '32%',
  },
];

export const ComponentHotspots: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="pointer-events-none absolute inset-0">
      {HOTSPOTS.map((spot) => {
        const active = activeId === spot.id;
        return (
          <div
            key={spot.id}
            className="pointer-events-auto absolute"
            style={{ top: spot.top, left: spot.left }}
            onMouseEnter={() => setActiveId(spot.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <button
              type="button"
              aria-label={spot.label}
              aria-expanded={active}
              aria-describedby={`${spot.id}-desc`}
              // mouseenter/leave alone leaves this dead on touch devices
              // (no hover state to trigger it), and focus/blur alone
              // meant a tap that didn't land exactly on the 12px target
              // never opened it either. onClick as an explicit toggle
              // covers touch and keyboard activation (Enter/Space) the
              // same way hover does for a mouse, and dismisses on a
              // second tap instead of needing a mouseleave that touch
              // never fires.
              onClick={() => setActiveId((current) => (current === spot.id ? null : spot.id))}
              onFocus={() => setActiveId(spot.id)}
              onBlur={() => setActiveId(null)}
              className="relative flex h-3 w-3 items-center justify-center rounded-full border border-white/70 bg-white/10 backdrop-blur-sm"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full bg-white transition-transform duration-300 ${
                  active ? 'scale-150' : ''
                }`}
              />
              <span className="absolute h-full w-full animate-ping rounded-full border border-white/40" />
            </button>

            <AnimatePresence>
              {active && (
                <motion.div
                  id={`${spot.id}-desc`}
                  role="tooltip"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-5 top-1/2 w-52 -translate-y-1/2 border border-white/15 bg-ink/95 p-3 backdrop-blur-md"
                >
                  <div className="font-body text-[11px] font-medium uppercase tracking-wider text-clay">
                    {spot.label}
                  </div>
                  <p className="mt-1 font-body text-[13px] leading-snug text-white/75">
                    {spot.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
