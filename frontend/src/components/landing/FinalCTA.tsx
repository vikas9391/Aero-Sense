import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const EASE = [0.16, 1, 0.3, 1] as const;

// Closing narrative beat before the footer. Mirrors SolutionFeature's
// full-bleed ink panel (same section shell, same reveal timing) so the
// page opens and closes on the same dark note. Both CTAs route to
// /login — there's no public /verify route (VerifyPage sits behind
// ProtectedRoute), so "Verify a Component" hands off to sign-in the
// same way Footer's "Access Platform" already does.
export const FinalCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="final-cta" className="bg-white px-6 pb-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-col items-center gap-8 bg-[var(--color-ink)] px-8 py-20 text-center md:px-16 md:py-28"
        >
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            AERO-SENSE
          </span>
          <h2 className="max-w-3xl font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-[3.5rem]">
            Know every component. Trust every flight.
          </h2>
          <p className="max-w-xl font-body text-lg leading-relaxed text-white/75">
            Secure digital identity, verifiable maintenance history and NFC-based
            authentication for every aircraft component you operate.
          </p>
          <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="pill-btn pill-btn-on-dark"
            >
              Explore Aero-Sense
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="pill-btn pill-btn-ghost-on-dark"
            >
              Verify a Component
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
