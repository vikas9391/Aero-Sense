import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Menu, X, ShieldCheck } from 'lucide-react';

const LINKS = [
  { label: 'Platform', href: '#solution' },
  { label: 'Digital Twin', href: '#digital-twin' },
  { label: 'How it works', href: '#passport' },
  { label: 'Security', href: '#security' },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function scrollToId(id: string, reducedMotion: boolean) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

export const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (href: string) => {
    setMobileOpen(false);
    scrollToId(href, Boolean(prefersReducedMotion));
  };

  return (
    <header className="relative z-50 mx-auto flex w-full max-w-[1680px] items-center justify-between px-5 pt-5 md:px-8 lg:px-10 lg:pt-6">
      <motion.button
        type="button"
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })}
        aria-label="AERO-SENSE home"
        className="group flex shrink-0 items-center gap-2.5 rounded-full border border-white/90 bg-white/90 px-2.5 py-2 pr-4 shadow-[0_12px_30px_rgba(79,70,229,.08)] backdrop-blur-xl"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="whitespace-nowrap font-display text-lg font-bold tracking-[-.04em] text-ink sm:text-xl md:text-2xl">
          AERO-SENSE
        </span>
      </motion.button>

      <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
        <nav className="hidden items-center gap-0.5 rounded-full border border-white/90 bg-white/85 p-1 shadow-[0_12px_30px_rgba(79,70,229,.08)] backdrop-blur-xl lg:flex">
          {LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => go(link.href)}
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-semibold text-ink/65 transition-all duration-200 hover:bg-accent-soft hover:text-accent xl:px-4 xl:text-[13px]"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="hidden shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_24px_rgba(79,70,229,.2)] transition duration-200 hover:-translate-y-0.5 sm:px-4.5 md:text-[13px] lg:flex"
        >
          Access platform
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pebble bg-white/90 text-ink shadow-sm backdrop-blur md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute left-5 right-5 top-full mt-3 flex flex-col gap-1 rounded-2xl border border-pebble bg-white/95 p-2 shadow-[0_24px_60px_rgba(17,20,43,.14)] backdrop-blur-xl md:hidden"
          >
            {LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => go(link.href)}
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink transition hover:bg-accent-soft hover:text-accent"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setMobileOpen(false); navigate('/login'); }}
              className="pill-btn pill-btn-primary mt-1"
            >
              Access platform
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNav;
