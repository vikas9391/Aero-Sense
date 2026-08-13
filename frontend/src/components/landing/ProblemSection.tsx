import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ITEMS = [
  {
    title: 'Serial Numbers',
    body: 'Can identify a component but provide limited proof of authenticity.',
  },
  {
    title: 'QR Codes',
    body: 'Can be copied or replaced without detection.',
  },
  {
    title: 'RFID',
    body: 'Provides identification but does not by itself guarantee trusted component history.',
  },
  {
    title: 'Physical Labels',
    body: 'Can be removed, damaged, or replaced.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const ProblemSection: React.FC = () => {
  // Spotlight state — shared across mouse, keyboard focus, and touch.
  // null means "no active item", i.e. neutral resting state.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          className="max-w-3xl font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]"
        >
          Traditional identification isn't enough.
        </motion.h2>

        <div
          className="mt-16 grid grid-cols-1 border-t border-pebble sm:grid-cols-2 lg:grid-cols-4"
          // Tapping the grid background (not an item) clears the spotlight
          // on touch devices. Items stop propagation on their own
          // touchstart so this never fires when tapping an item itself.
          onTouchStart={() => setActiveIndex(null)}
        >
          {ITEMS.map((item, i) => {
            const isActive = activeIndex === i;
            const isDimmed = activeIndex !== null && !isActive;

            return (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                tabIndex={0}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
                className={`border-b border-r px-6 py-10 outline-none transition-[opacity,border-color] duration-300 ease-out first:pl-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0 focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 ${
                  isActive ? 'border-ink/30' : 'border-pebble'
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                <span
                  className={`font-body text-xs transition-colors duration-300 ${
                    isActive ? 'text-ink' : 'text-ash'
                  }`}
                >
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 font-body text-[15px] leading-relaxed text-ash">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};