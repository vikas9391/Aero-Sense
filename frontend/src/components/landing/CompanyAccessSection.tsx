import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Building2, CheckCircle2, Factory, ShieldCheck, Wrench } from 'lucide-react';

const LEVELS = [
  { label: 'Manufacturer', body: "Creates and registers a component's digital identity before it enters service.", icon: Factory },
  { label: 'Maintenance / MRO', body: 'Records inspections, maintenance events, and component history throughout its lifecycle.', icon: Wrench },
  { label: 'Aircraft Operator', body: 'Tracks installed components and verifies their identity before they enter service.', icon: Building2 },
  { label: 'Authorized Users', body: 'Access component records according to their assigned role and permissions.', icon: ShieldCheck },
];

export const CompanyAccessSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="bg-[var(--bg-app)] px-6 py-28 md:px-10">
      <div className="mx-auto max-w-[1400px] rounded-[2rem] border border-indigo-100/80 bg-white/75 p-8 shadow-[0_24px_80px_rgba(79,70,229,0.07)] backdrop-blur-xl md:p-12 lg:p-16">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
              Connected organizations
            </span>
            <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-[3.5rem]">
              One platform.
              <br />
              One trusted component record.
            </h2>
            <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
              AERO-SENSE connects manufacturers, maintenance teams, operators, and authorized users around a single digital identity for every aviation component.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold text-ink">Role-aware access</div>
                <div className="mt-0.5 text-xs text-ash">Each organization sees the records and actions it is authorized to use.</div>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col" onTouchStart={() => setActiveIndex(null)}>
            {LEVELS.map((level, i) => {
              const isActive = activeIndex === i;
              const isDimmed = activeIndex !== null && !isActive;
              const Icon = level.icon;

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
                    onTouchStart={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    className={`group flex items-center gap-4 rounded-2xl border px-5 py-5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 ${isActive ? 'border-indigo-200 bg-indigo-50/80 shadow-sm' : 'border-transparent bg-white/50 hover:border-indigo-100 hover:bg-white'} ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-50 text-indigo-500'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-display text-xl font-semibold text-ink">{level.label}</span>
                      <p className={`mt-1 max-w-xl font-body text-sm leading-relaxed text-ash transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                        {level.body}
                      </p>
                    </div>
                    <ArrowDown className={`hidden h-4 w-4 shrink-0 text-indigo-400 transition-transform duration-300 sm:block ${isActive ? 'translate-y-1 rotate-0' : ''}`} />
                  </div>
                  {i < LEVELS.length - 1 && <div className="ml-10 h-3 w-px bg-gradient-to-b from-indigo-200 to-transparent" aria-hidden="true" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyAccessSection;
