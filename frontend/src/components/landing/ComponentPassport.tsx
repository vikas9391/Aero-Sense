import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const LIFECYCLE = ['Manufactured', 'Registered', 'Inspected', 'Maintained'] as const;
const EASE = [0.16, 1, 0.3, 1] as const;

const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const fieldReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const ComponentPassport: React.FC = () => {
  return (
    <section id="component-passport" className="bg-white px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Digital Component Passport
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            Every component has a story.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            A secure digital passport brings identity, verification and lifecycle history together in one place.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={cardReveal}
          className="relative overflow-hidden rounded-[26px] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-blue-50/60 p-7 text-ink shadow-[0_24px_70px_rgba(79,70,229,.10)] md:rounded-[30px] md:p-9"
        >
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-200/25 blur-3xl" />

          <motion.div variants={fieldReveal} className="relative flex items-center justify-between border-b border-indigo-100 pb-5">
            <div>
              <div className="font-display text-sm font-semibold tracking-tight">AERO-SENSE</div>
              <div className="mt-1 font-body text-[11px] uppercase tracking-[0.15em] text-ash">Digital identity record</div>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
              Secure
            </span>
          </motion.div>

          <motion.div variants={fieldReveal} className="relative mt-7 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm">
            <div className="font-body text-[10px] uppercase tracking-[0.15em] text-ash">Component identity</div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display text-lg font-semibold">Verified identity</div>
                <div className="mt-0.5 font-body text-xs text-ash">Authenticated component record</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fieldReveal} className="relative mt-6 border-t border-indigo-100 pt-6">
            <div className="font-body text-[10px] uppercase tracking-[0.15em] text-ash">Lifecycle</div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LIFECYCLE.map((stage, index) => (
                <div key={stage} className="rounded-xl border border-indigo-100 bg-white/70 p-3">
                  <div className="font-mono text-[9px] text-indigo-500">0{index + 1}</div>
                  <div className="mt-2 font-body text-xs font-semibold text-ink/75">{stage}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComponentPassport;
