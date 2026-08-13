import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

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
// positioning, so it can never overlap the huge wordmark below it.
export const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  return (
    <header className="relative z-10 flex items-start justify-between px-6 pt-8 md:px-12 md:pt-10">
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

      <div className="flex items-center gap-7 pt-2 md:pt-3">
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
              onClick={() => scrollToId(link.href, Boolean(prefersReducedMotion))}
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
          // Token doc's "Circular Icon Button": 100% radius, background
          // #000d10, white icon, square hit area — rounded-full + bg-ink
          // already matches this; left as-is.
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-transform duration-200 hover:scale-105 hover:bg-[#001a20] active:scale-95"
        >
          <ArrowUpRight className="h-4 w-4" />
        </motion.button>
      </div>
    </header>
  );
};