import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const LINKS = [
  { label: 'Platform', href: '#solution' },
  { label: 'How It Works', href: '#passport' },
  { label: 'Security', href: '#security' },
  { label: 'Traceability', href: '#traceability' },
];

function scrollToId(id: string, reducedMotion: boolean) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

// Load-in only — opacity + translateY, no motion tied to scroll or hover
// here. Hover/active-section states are a separate pass so this stays
// additive rather than something to unwind later.
// `as const` on the ease tuples: this framer-motion version's `Variants`
// type wants a literal 4-tuple (cubic-bezier), not a general `number[]` —
// without the assertion, TS widens the array and `tsc -b` fails the build.
const EASE = [0.16, 1, 0.3, 1] as const;

const wordmarkVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
const linksVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
};
const linkItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

// Static — scrolls away with the page like the reference. No fixed
// positioning, so it can never overlap the huge wordmark below it or
// fight with Hero's `position: sticky` pin. Section 8 of the redesign
// blueprint asks for a scroll-triggered floating capsule; that's
// deliberately deferred rather than bolted on here, since making this
// header fixed would need to be re-coordinated with Hero's pin and
// SectionProgress's own fixed dot-nav to avoid overlap — a separate,
// riskier pass, not a same-file tweak.
export const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goToLink = (href: string) => {
    setMobileOpen(false);
    scrollToId(href, Boolean(prefersReducedMotion));
  };

  return (
    <header className="relative z-20 flex items-start justify-between px-6 pt-8 md:px-12 md:pt-10">
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate="visible"
        variants={wordmarkVariants}
        className="font-display font-bold uppercase text-ink"
        style={{
          // Token doc's "Hero Wordmark" component, exactly: 131px weight
          // 700, letter-spacing -2.62px, #000d10. Clamped down on smaller
          // viewports (the 131px value is a desktop-scale token, not
          // responsive on its own) but pinned to the real 131px at the
          // top end instead of the previous untokenized 7.5rem/120px cap.
          fontSize: 'clamp(2.75rem, 8vw, 131px)',
          lineHeight: 0.85,
          letterSpacing: '-2.62px',
        }}
      >
        AERO-SENSE
      </motion.button>

      <div className="flex items-center gap-3 pt-2 md:gap-7 md:pt-3">
        <motion.nav
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate="visible"
          variants={linksVariants}
          className="hidden items-center gap-7 md:flex"
        >
          {LINKS.map((link) => (
            <motion.button
              key={link.href}
              variants={linkItemVariants}
              onClick={() => goToLink(link.href)}
              // Token doc's "Top Navigation" component: items at 20px
              // weight 400, #000d10 on light (was text-sm/text-ink/70 —
              // wrong size token and using the muted "cool-ash" opacity
              // treatment where the spec wants full deep-ink).
              className="font-body text-ink transition-colors hover:text-ink/70"
              style={{ fontSize: '20px' }}
            >
              {link.label}
            </motion.button>
          ))}
        </motion.nav>

        <motion.button
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
          onClick={() => navigate('/login')}
          aria-label="Access Platform"
          // Recolored from the previous indigo-gradient circle (the
          // dashboard's accent) to the landing page's own ink/pebble
          // design system — the blueprint calls for one primary accent
          // and no stray unrelated colors on the marketing site.
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-transform duration-200 hover:scale-105 hover:bg-[#001a20] active:scale-95 md:flex"
        >
          <ArrowUpRight className="h-4 w-4" />
        </motion.button>

        {/* Mobile nav — the desktop link row and CTA above are md:flex
            only, so under md there was previously no way to reach
            Platform/How It Works/Security/Traceability at all, and no
            way to reach login. This is the fallback: a hamburger toggle
            plus a slide-down panel covering the same links and the same
            CTA, closing itself on link tap. */}
        <motion.button
          type="button"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-nav"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pebble text-ink transition-colors hover:border-ink md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="landing-mobile-nav"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="hairline absolute left-6 right-6 top-full z-20 mt-3 flex flex-col gap-1 rounded-2xl bg-white/95 p-3 shadow-[0_16px_40px_-16px_rgba(0,13,16,0.25)] backdrop-blur-sm md:hidden"
          >
            {LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => goToLink(link.href)}
                className="font-body rounded-xl px-4 py-3 text-left text-ink transition-colors hover:bg-ink/5"
                style={{ fontSize: '17px' }}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate('/login');
              }}
              className="pill-btn pill-btn-primary mt-1 justify-center"
            >
              Access Platform
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
