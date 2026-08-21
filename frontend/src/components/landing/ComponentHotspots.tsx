import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Hotspot {
  id: string;
  label: string;
  componentId: string;
  status: 'verified' | 'maintenance-due';
  lastInspection: string;
  nextMaintenance: string;
  /** Position as a percentage of the container, e.g. { top: '20%', left: '65%' } */
  top: string;
  left: string;
}

// Positions are tuned to the specific aircraft photo this renders over
// (the Hero's first cinematic frame, /cinematic/aircraft/ezgif-frame-001.jpg
// — a side-profile business jet in flight, nose to the left). Re-check
// placement against the image if that source frame ever changes.
//
// Example data only, per blueprint §12 ("These values are examples
// only. Use real API values where available.") — not a live feed of
// any particular aircraft or company's fleet.
const HOTSPOTS: Hotspot[] = [
  {
    id: 'avionics',
    label: 'Avionics',
    componentId: 'AS-AV-1187',
    status: 'verified',
    lastInspection: '03 Jul 2026',
    nextMaintenance: '58 days',
    top: '56.5%',
    left: '16.5%',
  },
  {
    id: 'fuselage',
    label: 'Fuselage',
    componentId: 'AS-FUS-1420',
    status: 'verified',
    lastInspection: '30 Jul 2026',
    nextMaintenance: '88 days',
    top: '50%',
    left: '29%',
  },
  {
    id: 'engine',
    label: 'Engine',
    componentId: 'AS-ENG-2048',
    status: 'verified',
    lastInspection: '12 Aug 2026',
    nextMaintenance: '42 days',
    top: '50%',
    left: '55%',
  },
  {
    id: 'empennage',
    label: 'Empennage',
    componentId: 'AS-TAL-0532',
    status: 'maintenance-due',
    lastInspection: '04 May 2026',
    nextMaintenance: '6 days',
    top: '29%',
    left: '63%',
  },
  {
    id: 'wing',
    label: 'Wing Structure',
    componentId: 'AS-WNG-0876',
    status: 'verified',
    lastInspection: '22 Jun 2026',
    nextMaintenance: '71 days',
    top: '66%',
    left: '87%',
  },
];

export const ComponentHotspots: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="pointer-events-none absolute inset-0">
      {HOTSPOTS.map((spot) => {
        const active = activeId === spot.id;
        const verified = spot.status === 'verified';

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
              aria-label={`${spot.label} — ${verified ? 'verified' : 'maintenance due'}`}
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
                className={`h-1.5 w-1.5 rounded-full transition-transform duration-300 ${
                  verified ? 'bg-white' : 'bg-amber-400'
                } ${active ? 'scale-150' : ''}`}
              />
              <span
                className={`absolute h-full w-full animate-ping rounded-full border ${
                  verified ? 'border-white/40' : 'border-amber-400/50'
                }`}
              />
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
                  className="absolute left-5 top-1/2 w-60 -translate-y-1/2 border border-white/15 bg-ink/95 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="font-body text-[11px] font-medium uppercase tracking-wider text-clay">
                      {spot.label}
                    </div>
                    {verified ? (
                      <span className="flex items-center gap-1 font-body text-[10px] uppercase tracking-wide text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-body text-[10px] uppercase tracking-wide text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        Due Soon
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-y-2.5 gap-x-3">
                    <div>
                      <div className="font-body text-[9px] uppercase tracking-[0.12em] text-white/45">
                        Component ID
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-white/85">
                        {spot.componentId}
                      </div>
                    </div>
                    <div>
                      <div className="font-body text-[9px] uppercase tracking-[0.12em] text-white/45">
                        Next Maintenance
                      </div>
                      <div className="mt-0.5 font-body text-[11px] text-white/85">
                        {spot.nextMaintenance}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-body text-[9px] uppercase tracking-[0.12em] text-white/45">
                        Last Inspection
                      </div>
                      <div className="mt-0.5 font-body text-[11px] text-white/85">
                        {spot.lastInspection}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default ComponentHotspots;
