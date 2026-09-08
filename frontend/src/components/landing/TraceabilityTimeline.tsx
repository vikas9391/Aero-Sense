import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const STAGES = [
  { label: 'Manufactured', body: 'The component is produced and given a base identity record.' },
  { label: 'Registered', body: 'Its digital identity is registered on the platform.' },
  { label: 'Inspected', body: 'Quality and conformity are checked against its record.' },
  { label: 'Installed', body: 'The component is fitted and linked to its aircraft.' },
  { label: 'Maintained', body: 'Maintenance actions are logged against its history.' },
  { label: 'Verified', body: 'Authorized organizations can verify its full history.' },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export const TraceabilityTimeline: React.FC = () => {
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start center', 'end center'] });
  const scrollStageMV = useTransform(scrollYProgress, [0, 1], [0, STAGES.length - 1]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? scrollIndex;

  useMotionValueEvent(scrollStageMV, 'change', (value) => {
    const next = Math.min(STAGES.length - 1, Math.max(0, Math.round(value)));
    setScrollIndex((current) => (current === next ? current : next));
  });

  return (
    <section id="traceability" className="bg-white px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Lifecycle traceability
          </span>
          <h2 className="mt-5 max-w-2xl font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            From component to complete lifecycle.
          </h2>
        </motion.div>

        <div ref={listRef} className="mt-14 flex flex-col rounded-[26px] border border-indigo-100 bg-[var(--bg-app)] p-2 shadow-[0_20px_60px_rgba(79,70,229,.07)] md:mt-20 md:p-4">
          {STAGES.map((stage, i) => (
            <motion.button
              key={stage.label}
              type="button"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.05, ease: EASE }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              className="group flex items-center gap-4 rounded-2xl border-b border-indigo-100 px-4 py-5 text-left last:border-b-0 hover:bg-white/70 md:gap-6 md:px-6 md:py-6"
            >
              <span className={`font-mono text-xs transition-colors duration-300 ${activeIndex === i ? 'text-indigo-600' : 'text-ash/60'}`}>0{i + 1}</span>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-all duration-300 ${activeIndex === i ? 'scale-110 border-blue-600 bg-blue-600 shadow-[0_0_0_5px_rgba(37,99,235,.10)]' : 'border-indigo-200 bg-white'}`} />
              <span className={`font-display text-2xl font-semibold tracking-tight transition-colors duration-300 sm:text-3xl ${activeIndex === i ? 'text-ink' : 'text-ink/55 group-hover:text-ink/80'}`}>
                {stage.label}
              </span>
              <span className={`ml-auto hidden max-w-sm font-body text-sm leading-relaxed text-ash transition-opacity duration-300 md:block ${activeIndex === i ? 'opacity-100' : 'opacity-0'}`}>
                {stage.body}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TraceabilityTimeline;
