import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const LIFECYCLE = ['Manufactured', 'Registered', 'Inspected', 'Maintained'] as const;
const EASE = [0.16, 1, 0.3, 1] as const;

// Card-level entrance — same fade-up-on-scroll treatment the card already
// had, now also acting as the stagger parent for the fields inside it.
const cardReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE,
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// Per-field reveal — no new fields, no new data, just a staged fade-up
// for each existing field group as the card comes into view.
const fieldReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

export const ComponentPassport: React.FC = () => {
  // Verify Identity demo — a simulated tap/scan, not a real NFC read.
  // idle -> verifying -> verified, all client-side and time-based.
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleVerify = () => {
    if (verifyState !== 'idle') return;
    setVerifyState('verifying');
    timeoutRef.current = window.setTimeout(() => setVerifyState('verified'), 1100);
  };

  return (
    // id="passport" moved to HowItWorks below — the nav's "How It Works"
    // link (#passport) is meant to target that section, not this one.
    // Both sections using id="passport" was a duplicate-ID bug (invalid
    // HTML — an id must be unique per page, and getElementById /
    // in-page anchors only ever resolve to the first match).
    <section id="component-passport" className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            Every component
            <br />
            has a story.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            A digital component passport brings a part's identity, verification status, and
            lifecycle together in one trusted record — a concept view of how AERO-SENSE
            presents a component, not a live data feed.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={cardReveal}
          className="border border-pebble bg-[var(--bg-app)] p-8 text-ink md:p-10"
        >
          <motion.div
            variants={fieldReveal}
            className="flex items-center justify-between border-b border-pebble pb-6"
          >
            <div>
              <div className="font-display text-sm font-semibold tracking-tight">AERO-SENSE</div>
              <div className="mt-1 font-body text-[11px] uppercase tracking-[0.15em] text-ash">
                Digital Component Passport
              </div>
            </div>
            <span className="font-body text-[11px] uppercase tracking-widest text-ash">
              Concept
            </span>
          </motion.div>

          <motion.div variants={fieldReveal} className="mt-6">
            <div className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
              Component
            </div>
            <div className="mt-1 font-display text-xl font-semibold">Turbine Blade Assembly</div>
          </motion.div>

          <motion.div variants={fieldReveal} className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <div className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
                Component ID
              </div>
              <div className="mt-1 font-mono text-sm text-ink/80">AS-TRB-20491</div>
            </div>
            <div>
              <div className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
                Status
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Verified
              </div>
            </div>
          </motion.div>

          <motion.div variants={fieldReveal} className="mt-8 border-t border-pebble pt-6">
            <div className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
              Lifecycle
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {LIFECYCLE.map((stage) => (
                <div key={stage} className="flex items-center gap-2 font-body text-sm text-ink/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  {stage}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Verify Identity demo — explicitly labeled as a simulation.
              No hardware access, no real NFC read; the copy says so at
              every state so it can't be mistaken for a live scan. */}
          <motion.div variants={fieldReveal} className="mt-8 border-t border-pebble pt-6">
            <div className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
              Verify Identity
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifyState !== 'idle'}
                className="inline-flex items-center gap-2 border border-pebble px-4 py-2 font-body text-sm text-ink/90 transition-colors duration-300 hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-default"
              >
                {verifyState === 'idle' && 'Simulate Verification'}
                {verifyState === 'verifying' && 'Verifying…'}
                {verifyState === 'verified' && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verified
                  </>
                )}
              </button>
              {verifyState === 'verified' && (
                <span className="font-body text-xs text-ash">
                  Simulated result — demo only, no physical NFC scan performed.
                </span>
              )}
            </div>
            {verifyState === 'idle' && (
              <p className="mt-2 font-body text-xs text-ash">
                Tap to simulate how identity verification would appear. This is a concept
                demo, not a live NFC scan.
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComponentPassport;