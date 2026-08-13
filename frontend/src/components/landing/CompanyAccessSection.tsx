import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const LEVELS = [
  { label: 'Manufacturer', body: "Creates and registers a component's digital identity before it enters service." },
  { label: 'Maintenance / MRO', body: 'Records inspections, maintenance events, and component history throughout its lifecycle.' },
  { label: 'Aircraft Operator', body: 'Tracks installed components and verifies their identity before they enter service.' },
  { label: 'Authorized Users', body: 'Access component records according to their assigned role and permissions.' },
];

export const CompanyAccessSection: React.FC = () => {
  // Row spotlight state — shared across mouse, keyboard focus, and touch,
  // same pattern as ProblemSection's activeIndex.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            One platform.
            <br />
            One trusted component record.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            AERO-SENSE connects manufacturers, maintenance teams, operators, and authorized
            users around a single digital identity for every aviation component.
          </p>
        </div>

        <div
          className="flex flex-col"
          // Tapping the column background (not a row) clears the spotlight
          // on touch devices, mirroring ProblemSection.
          onTouchStart={() => setActiveIndex(null)}
        >
          {LEVELS.map((level, i) => {
            const isActive = activeIndex === i;
            const isDimmed = activeIndex !== null && !isActive;

            return (
              <motion.div
                key={level.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div
                  tabIndex={0}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  className={`flex items-start justify-between gap-6 border-t py-6 outline-none transition-[opacity,border-color] duration-300 ease-out last:border-b focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 ${
                    isActive ? 'border-ink/30' : 'border-pebble'
                  } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                >
                  <span className="font-display text-xl font-semibold text-ink">{level.label}</span>
                  <p
                    className={`max-w-[220px] text-right font-body text-sm leading-relaxed text-ash transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    {level.body}
                  </p>
                </div>
                {i < LEVELS.length - 1 && (
                  <div className="flex justify-center py-1 text-ash/50">
                    <ArrowDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ease-out ${
                        isActive ? 'translate-y-2' : 'translate-y-0'
                      }`}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CompanyAccessSection;