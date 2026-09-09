import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Download, ArrowRight, Command } from 'lucide-react';
import { AeroLogo } from './Logo';
import { useLocation, useNavigate } from 'react-router-dom';

const searchTargets = [
  { label: 'Dashboard', keywords: 'home overview operations', path: '/dashboard' },
  { label: 'Aircraft Fleet', keywords: 'planes registrations fleet', path: '/aircraft' },
  { label: 'Component Catalog', keywords: 'parts serial components', path: '/components' },
  { label: 'Verify Component', keywords: 'NFC scan authenticity verification', path: '/verify' },
  { label: 'Register Component', keywords: 'new component registration', path: '/components/register' },
  { label: 'Bind NFC / RFID Tag', keywords: 'NFC RFID tag binding', path: '/nfc/register' },
  { label: 'Maintenance', keywords: 'service repair maintenance', path: '/maintenance' },
  { label: 'Security & Audit', keywords: 'security alerts audit logs', path: '/security' },
  { label: 'Analytics', keywords: 'reports metrics work analytics', path: '/analytics' },
  { label: 'User Management', keywords: 'users team employees', path: '/users' },
  { label: 'My Profile', keywords: 'account password profile', path: '/profile' },
];

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = searchTargets
    .filter((item) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      return `${item.label} ${item.keywords}`.toLowerCase().includes(q);
    })
    .slice(0, 7);

  useEffect(() => {
    setQuery('');
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const goToResult = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (results[0]) goToResult(results[0].path);
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-white/70 bg-[#f8fbfc]/95 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><AeroLogo size="md" /></div>

        <div className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">
          <div ref={searchRef} className="relative w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative z-[102] flex w-full items-center gap-3 rounded-2xl border border-pebble bg-white px-4 py-2.5 text-sm shadow-[0_5px_20px_rgba(7,18,24,.06)] transition focus-within:border-accent/40 focus-within:shadow-[0_12px_40px_-24px_rgba(23,105,255,.35)]">
              <Search className="h-4 w-4 shrink-0 text-accent" />
              <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search aircraft, components, NFC tags or maintenance..." aria-label="Search AeroSense" className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ash" />
              <button type="button" onClick={() => { inputRef.current?.focus(); setOpen(true); }} className="hidden shrink-0 items-center gap-1 rounded-lg border border-pebble bg-cream px-2 py-1 text-[9px] font-bold text-ash transition hover:border-accent/20 hover:text-accent sm:flex" title="Focus search"><Command className="h-2.5 w-2.5" />K</button>
            </form>

            {open && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[101] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_28px_80px_-28px_rgba(7,18,24,.45)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Quick navigation</div><div className="mt-0.5 text-xs text-slate-500">{query ? `Matching “${query}”` : 'Jump to an AeroSense workspace'}</div></div>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50">Esc</button>
                </div>
                <div className="max-h-[min(520px,70vh)] overflow-y-auto p-2">
                  {results.length ? results.map((item, index) => (
                    <button key={item.path} type="button" onClick={() => goToResult(item.path)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#eef4ff] focus:bg-[#eef4ff] focus:outline-none">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold text-accent group-hover:border-accent/20">{String(index + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.keywords}</span></span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                    </button>
                  )) : <div className="px-4 py-10 text-center"><Search className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No results found</p><p className="mt-1 text-xs text-slate-500">Try aircraft, components, NFC, verification or maintenance.</p></div>}
                </div>
                <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400"><span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-semibold text-slate-500">Enter</span><span>open first result</span><span className="ml-auto rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-semibold text-slate-500">Ctrl K</span><span>focus search</span></div>
              </div>
            )}
          </div>
        </div>

        {user && <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a href="/aerosense.apk" download className="hidden items-center gap-2 rounded-xl border border-accent/15 bg-accent-soft px-3 py-2 text-xs font-bold text-accent transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 sm:flex" title="Download AeroSense Android App"><Download className="h-3.5 w-3.5" /><span>Get App</span></a>
          <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-pebble bg-white/80 text-ash shadow-sm transition hover:border-accent/25 hover:bg-white hover:text-accent sm:flex" title="Notifications"><Bell className="h-4 w-4" /></button>
        </div>}
      </div>
    </header>
  );
};
