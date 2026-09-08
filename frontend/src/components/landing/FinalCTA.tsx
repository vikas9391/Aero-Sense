import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Fingerprint, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EASE = [0.16, 1, 0.3, 1] as const;

export const FinalCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="final-cta" className="bg-[var(--bg-app)] px-6 pb-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[2rem] border border-indigo-200/80 bg-gradient-to-br from-indigo-700 via-blue-700 to-violet-700 px-8 py-20 text-center shadow-[0_30px_90px_rgba(79,70,229,0.20)] md:px-16 md:py-28"
        >
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:36px_36px]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute -right-28 -top-28 h-72 w-72 rounded-full border border-white/15"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-36 -left-20 h-80 w-80 rounded-full border border-white/10"
          />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <Fingerprint className="h-3.5 w-3.5 text-white/90" />
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">AERO-SENSE</span>
            </div>
            <h2 className="font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-[3.75rem]">
              Know every component.
              <br />
              Trust every flight.
            </h2>
            <p className="max-w-xl font-body text-lg leading-relaxed text-white/80">
              Connect physical component identity with the digital record that follows it through its lifecycle.
            </p>

            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-body text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-950/15 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700">
                Explore Aero-Sense
                <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 font-body text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700">
                <ShieldCheck className="h-4 w-4" />
                Verify a Component
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
