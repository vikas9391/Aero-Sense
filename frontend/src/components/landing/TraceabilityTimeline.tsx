import React, { useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useRef } from 'react';

const STAGES = [
  { label: 'Manufactured', body: 'The component is produced and given a base identity record.' },
  { label: 'Registered', body: 'Its digital identity is registered on the platform.' },
  { label: 'Inspected', body: 'Quality and conformity are checked against its record.' },
  { label: 'Installed', body: 'The component is fitted and linked to its aircraft.' },
  { label: 'Maintained', body: 'Maintenance actions are logged against its history.' },
  { label: 'Verified', body: 'Authorized organizations can verify its full history.' },
];

export const TraceabilityTimeline: React.FC = () => {
  const listRef = useRef<HTMLDivElement>(null);

  // Primary driver: scroll progress through the list itself. 'start
  // center' -> 'end center' means the mapped index tracks whichever
  // stage is nearest the viewport's vertical center as the user scrolls,
  // independent of any pointer/keyboard interaction.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start center', 'end center'],
  });
  const scrollStageMV = useTransform(scrollYProgress, [0, 1], [0, STAGES.length - 1]);

  const [scrollIndex, setScrollIndex] = useState(0);
  useMotionValueEvent(scrollStageMV, 'change', (v) => {
    const clamped = Math.min(STAGES.length - 1, Math.max(0, Math.round(v)));
    setScrollIndex((cur) => (cur === clamped ? cur : clamped));
  });

  // Secondary override: hover/focus, exactly as before. When present it
  // wins over the scroll-driven value; clearing it (mouse leave / blur)
  // falls back to whatever the scroll position currently indicates.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? scrollIndex;

  return (
    <section id="traceability" className="bg-slate px-6 py-28 text-white md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.5rem]"
        >
          From component to complete lifecycle.
        </motion.h2>

        <div ref={listRef} className="mt-20 flex flex-col">
          {STAGES.map((stage, i) => (
            <motion.button
              key={stage.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              className="group flex items-center gap-6 border-t border-white/10 py-6 text-left last:border-b"
            >
              <span className="font-body text-xs text-white/40">0{i + 1}</span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full border border-white/40 transition-colors duration-300 ${
                  activeIndex === i ? 'bg-clay border-clay' : 'bg-transparent'
                }`}
              />
              <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {stage.label}
              </span>
              <span
                className={`ml-auto hidden max-w-sm font-body text-sm text-white/55 transition-opacity duration-300 md:block ${
                  activeIndex === i ? 'opacity-100' : 'opacity-0'
                }`}
              >
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