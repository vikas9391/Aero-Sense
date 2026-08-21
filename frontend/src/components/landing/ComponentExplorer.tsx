import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Cog, Feather, CircleDot, Disc, Cpu, Fuel, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  status: 'verified' | 'attention';
}

// Example counts only, per the same "illustration, not a live feed"
// convention as DigitalTwinSection and ComponentPassport. component_type
// on the actual Component model is a free-text string (no fixed
// category enum in the backend), so these six categories are a display
// grouping rather than a real filter key — clicking through goes to
// sign-in first, same as every other landing CTA, rather than a filtered
// /components view that doesn't exist yet.
const CATEGORIES: Category[] = [
  { id: 'engine', name: 'Engine', icon: Cog, count: 428, status: 'verified' },
  { id: 'wing', name: 'Wing', icon: Feather, count: 612, status: 'verified' },
  { id: 'landing-gear', name: 'Landing Gear', icon: CircleDot, count: 284, status: 'verified' },
  { id: 'brake', name: 'Brake System', icon: Disc, count: 356, status: 'attention' },
  { id: 'avionics', name: 'Avionics', icon: Cpu, count: 519, status: 'verified' },
  { id: 'fuel', name: 'Fuel System', icon: Fuel, count: 197, status: 'verified' },
];

const cardReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const ComponentExplorer: React.FC = () => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-explorer-card]') as HTMLElement | null;
    const step = (card?.offsetWidth ?? 280) + 20;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section id="component-explorer" className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-2xl"
          >
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-ash">
              Component Explorer
            </span>
            <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
              Every system.
              <br />
              One catalog.
            </h2>
          </motion.div>

          {/* Prev/Next — same treatment as HowItWorks's carousel controls. */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Scroll categories left"
              className="flex h-10 w-10 items-center justify-center border border-pebble text-ink transition-colors duration-300 hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Scroll categories right"
              className="flex h-10 w-10 items-center justify-center border border-pebble text-ink transition-colors duration-300 hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div
          ref={trackRef}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={cardReveal}
          className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const attention = category.status === 'attention';

            return (
              <motion.button
                key={category.id}
                data-explorer-card
                type="button"
                variants={cardItem}
                onClick={() => navigate('/login')}
                // Slight 3D tilt on hover — a light stand-in for the
                // blueprint's "perspective" explorer without adding a
                // 3D/GLB dependency for six flat icon cards.
                whileHover={{ rotateX: -3, rotateY: 3, y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}
                style={{ perspective: 800 }}
                className="group relative flex w-[240px] shrink-0 snap-start flex-col items-start border border-pebble p-7 text-left transition-colors duration-300 hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              >
                <span className="flex h-11 w-11 items-center justify-center border border-pebble text-ink transition-colors duration-300 group-hover:border-ink/40">
                  <Icon className="h-5 w-5" />
                </span>

                <h3 className="mt-6 font-display text-lg font-semibold text-ink">
                  {category.name}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      attention ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  />
                  <span className="font-body text-xs text-ash">
                    {attention ? 'Attention needed' : 'All verified'}
                  </span>
                </div>

                <div className="mt-5 border-t border-pebble pt-4 font-mono text-sm text-ink/70">
                  {category.count.toLocaleString()} components
                </div>

                <span className="mt-6 flex items-center gap-1.5 font-body text-xs font-medium text-ink/60 transition-colors duration-300 group-hover:text-ink">
                  View Components
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        <p className="mt-2 font-body text-xs text-ash">
          Example counts shown for illustration. Sign in to view your organization's actual
          component catalog.
        </p>
      </div>
    </section>
  );
};

export default ComponentExplorer;
