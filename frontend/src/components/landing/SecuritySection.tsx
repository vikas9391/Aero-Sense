import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Fingerprint, History, KeyRound, ShieldCheck, Tags } from 'lucide-react';

const FEATURES = [
  { title: 'NFC-bound component identity', body: 'Each component is linked to a unique digital identity that can be verified through its physical NFC tag.', icon: Fingerprint },
  { title: 'Tamper-evident records', body: 'Unauthorized changes to component history can be detected and trusted records preserved.', icon: History },
  { title: 'Role-based access', body: 'Users only access the component information and actions permitted by their role.', icon: KeyRound },
  { title: 'Company isolation', body: 'Organizations operate within controlled environments with separated component data.', icon: Building2 },
  { title: 'Secure authentication', body: 'Authenticated users and authorized requests protect access to component records.', icon: ShieldCheck },
  { title: 'Traceable lifecycle history', body: 'Important component events contribute to a persistent record from registration through maintenance.', icon: Tags },
];

export const SecuritySection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="security" className="bg-[var(--bg-app)] px-6 py-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
              Security architecture
            </span>
            <h2 className="mt-5 max-w-2xl font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-[3.5rem]">
              Security behind every identity.
            </h2>
          </div>
          <p className="max-w-md font-body text-sm leading-relaxed text-ash md:pb-1">
            Protection is built into the identity, access model, and lifecycle record—not added as a final layer.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" onTouchStart={() => setActiveIndex(null)}>
          {FEATURES.map((feature, i) => {
            const isActive = activeIndex === i;
            const isDimmed = activeIndex !== null && !isActive;
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                tabIndex={0}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                onFocus={() => setActiveIndex(i)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setActiveIndex((cur) => (cur === i ? null : cur));
                }}
                onTouchStart={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                className={`group relative min-h-[220px] overflow-hidden rounded-2xl border p-6 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 ${isActive ? 'border-indigo-200 bg-white shadow-[0_18px_45px_rgba(79,70,229,0.10)]' : 'border-indigo-100/70 bg-white/65 hover:bg-white'} ${isDimmed ? 'opacity-45' : 'opacity-100'}`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/50 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-50 text-indigo-500'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`relative mt-7 font-display text-lg font-semibold transition-transform duration-300 ${isActive ? 'translate-x-1' : ''}`}>
                  {feature.title}
                </h3>
                <p className="relative mt-3 font-body text-sm leading-relaxed text-ash">{feature.body}</p>
                <motion.div animate={{ scaleX: isActive ? 1 : 0 }} transition={{ duration: 0.35 }} className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
