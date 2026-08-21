import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { Activity, ShieldCheck, Wrench, AlertOctagon, Bell, Gauge } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Metric {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tone: 'ink' | 'verified' | 'warning' | 'critical';
}

// Example values only, per blueprint §19 ("Example values are
// placeholders only.") — a concept read of what a fleet-wide health
// summary would show, not a live aggregate of any company's data.
const METRICS: Metric[] = [
  { id: 'health', icon: Gauge, label: 'Overall Health', value: 96, suffix: '%', tone: 'verified' },
  { id: 'verified', icon: ShieldCheck, label: 'Verified Components', value: 2847, tone: 'ink' },
  { id: 'maintenance', icon: Wrench, label: 'Maintenance Due', value: 34, tone: 'warning' },
  { id: 'critical', icon: AlertOctagon, label: 'Critical Components', value: 3, tone: 'critical' },
  { id: 'alerts', icon: Bell, label: 'Active Alerts', value: 5, tone: 'warning' },
  {
    id: 'rate',
    icon: Activity,
    label: 'Verification Rate',
    value: 99.2,
    decimals: 1,
    suffix: '%',
    tone: 'verified',
  },
];

const TONE_CLASSES: Record<Metric['tone'], string> = {
  ink: 'text-ink',
  verified: 'text-emerald-600',
  warning: 'text-amber-600',
  critical: 'text-red-600',
};

// A count-up number, animated once when it scrolls into view. Reads
// prefers-reduced-motion and jumps straight to the final value instead
// of animating when set, per §30's accessibility requirement.
const AnimatedNumber: React.FC<{
  value: number;
  decimals?: number;
  suffix?: string;
  prefersReducedMotion: boolean | null;
}> = ({ value, decimals = 0, suffix = '', prefersReducedMotion }) => {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState((0).toFixed(decimals));

  useEffect(() => {
    const unsubscribe = motionValue.on('change', (v) => setDisplay(v.toFixed(decimals)));
    return unsubscribe;
  }, [motionValue, decimals]);

  const handleEnter = () => {
    if (prefersReducedMotion) {
      motionValue.set(value);
      return;
    }
    animate(motionValue, value, { duration: 1.5, ease: EASE });
  };

  return (
    <motion.span onViewportEnter={handleEnter} viewport={{ once: true, margin: '-60px' }}>
      {display}
      {suffix}
    </motion.span>
  );
};

const cardReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const AircraftHealth: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="aircraft-health" className="bg-[var(--bg-app)] px-6 py-28 text-ink md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl"
        >
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-ash">
            Aircraft Health
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.5rem]">
            Fleet health, at a glance.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={cardReveal}
          className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-pebble bg-pebble sm:grid-cols-2 lg:grid-cols-3"
        >
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.div key={metric.id} variants={cardItem} className="bg-[var(--bg-app)] p-8">
                <span className="flex h-10 w-10 items-center justify-center border border-pebble text-ink/70">
                  <Icon className="h-4 w-4" />
                </span>
                <div
                  className={`mt-6 font-display text-4xl font-semibold tracking-tight tabular-nums ${TONE_CLASSES[metric.tone]}`}
                >
                  <AnimatedNumber
                    value={metric.value}
                    decimals={metric.decimals}
                    suffix={metric.suffix}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </div>
                <div className="mt-2 font-body text-sm text-ash">{metric.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-4 font-body text-xs text-ash">
          Example values shown for illustration. Sign in to view your fleet's actual health
          summary.
        </p>
      </div>
    </section>
  );
};

export default AircraftHealth;
