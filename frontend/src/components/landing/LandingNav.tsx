import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Menu, X, ShieldCheck } from 'lucide-react';

const LINKS = [
  { label: 'Platform', href: '#solution' },
  { label: 'How it works', href: '#passport' },
  { label: 'Security', href: '#security' },
  { label: 'Traceability', href: '#traceability' },
];
const EASE = [0.16, 1, 0.3, 1] as const;
function scrollToId(id: string, reducedMotion: boolean) { const el = document.querySelector(id); if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }); }

export const LandingNav: React.FC = () => {
  const navigate = useNavigate(); const prefersReducedMotion = useReducedMotion(); const [mobileOpen, setMobileOpen] = useState(false);
  const go = (href: string) => { setMobileOpen(false); scrollToId(href, Boolean(prefersReducedMotion)); };
  return (
    <header className="relative z-30 flex items-center justify-between px-5 pt-5 md:px-10 md:pt-7">
      <motion.button initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: EASE }} onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })} className="flex items-center gap-3 rounded-full bg-white/75 px-3 py-2 pr-4 shadow-sm backdrop-blur-xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"><ShieldCheck className="h-4 w-4" /></span>
        <span className="font-display text-xl font-bold tracking-[-.04em] text-ink md:text-2xl">AERO-SENSE</span>
      </motion.button>
      <div className="flex items-center gap-3">
        <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/65 p-1 shadow-sm backdrop-blur-xl md:flex">
          {LINKS.map(link => <button key={link.href} onClick={() => go(link.href)} className="rounded-full px-4 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-ink hover:text-white">{link.label}</button>)}
        </nav>
        <button onClick={() => navigate('/login')} className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0d2730] md:flex">Access platform<ArrowUpRight className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} className="flex h-11 w-11 items-center justify-center rounded-full border border-pebble bg-white/75 text-ink shadow-sm backdrop-blur md:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-5 right-5 top-full mt-3 flex flex-col gap-1 rounded-2xl border border-pebble bg-white/95 p-2 shadow-2xl backdrop-blur-xl md:hidden">
        {LINKS.map(link => <button key={link.href} onClick={() => go(link.href)} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-accent-soft">{link.label}</button>)}
        <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="pill-btn pill-btn-primary mt-1">Access platform<ArrowUpRight className="h-4 w-4" /></button>
      </motion.div>}</AnimatePresence>
    </header>
  );
};
