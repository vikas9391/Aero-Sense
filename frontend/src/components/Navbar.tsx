import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Download, ArrowRight, Command } from 'lucide-react';
import { AeroLogo } from './Logo';
import { useLocation, useNavigate } from 'react-router-dom';

const searchTargets = [
  { label: 'Dashboard', keywords: 'dashboard home overview operations', path: '/dashboard' },
  { label: 'Aircraft Fleet', keywords: 'aircraft fleet plane registration', path: '/aircraft' },
  { label: 'Component Catalog', keywords: 'components component parts catalog serial', path: '/components' },
  { label: 'Verify Component', keywords: 'verify verification nfc scan tag authenticity', path: '/verify' },
  { label: 'Register Component', keywords: 'register component new part', path: '/components/register' },
  { label: 'Bind NFC / RFID Tag', keywords: 'nfc rfid tag bind register', path: '/nfc/register' },
  { label: 'Maintenance', keywords: 'maintenance service repair work', path: '/maintenance' },
  { label: 'Security & Audit', keywords: 'security audit logs alerts verification', path: '/security' },
  { label: 'Analytics', keywords: 'analytics work analytics reports metrics', path: '/analytics' },
  { label: 'User Management', keywords: 'users user management team employees', path: '/users' },
  { label: 'My Profile', keywords: 'profile account password settings', path: '/profile' },
];

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = searchTargets.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return `${item.label} ${item.keywords}`.toLowerCase().includes(q);
  }).slice(0, 6);

  useEffect(() => {
    setQuery('');
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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
    <header className="sticky top-0 z-50 border-b border-white/70 bg-[#f8fbfc]/90 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AeroLogo size="md" />
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">
          <div className="relative w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="group flex w-full items-center gap-3 rounded-2xl border border-pebble bg-white/80 px-4 py-2.5 text-sm text-ash shadow-[0_5px_20px_rgba(7,18,24,.035)] transition focus-within:border-accent/35 focus-within:bg-white focus-within:shadow-[0_14px_35px_-24px_rgba(23,105,255,.35)]">
              <Search className="h-4 w-4 shrink-0 text-accent" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Search aircraft, components, NFC tags or maintenance records..."
                aria-label="Search AeroSense"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ash/80"
              />
              <button type="button" onClick={() => { inputRef.current?.focus(); setOpen(true); }} className="ml-auto hidden shrink-0 items-center gap-1 rounded-lg border border-pebble bg-cream px-2 py-1 text-[9px] font-bold text-ash sm:flex" title="Focus search">
                <Command className="h-2.5 w-2.5" />K
              </button>
            </form>

            {open && (
              <>
                <button aria-label="Close search" className="fixed inset-0 z-[-1] h-screen w-screen cursor-default" onClick={() => setOpen(false)} />
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-pebble bg-white p-2 shadow-[0_24px_70px_-30px_rgba(7,18,24,.42)]">
                  <div className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[.18em] text-ash">
                    {query ? `Results for “${query}”` : 'Quick navigation'}
                  </div>
                  {results.length ? results.map((item, index) => (
                    <button key={item.path} type="button" onClick={() => goToResult(item.path)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent-soft">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-pebble bg-[var(--bg-app)] text-[10px] font-bold text-accent">{String(index + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{item.label}</span>
                        <span className="block truncate text-[10px] text-ash">{item.keywords.split(' ').slice(0, 5).join(' · ')}</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ash" />
                    </button>
                  )) : (
                    <div className="px-3 py-6 text-center text-xs text-ash">No matching AeroSense destination found.</div>
                  )}
                  <div className="mt-1 flex items-center gap-2 border-t border-pebble px-3 pt-2 text-[9px] text-ash"><span>Enter</span><span>open first result</span><span className="ml-auto">Esc</span><span>close</span></div>
                </div>
              </>
            )}
          </div>
        </div>

        {user && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a href="/aerosense.apk" download className="hidden items-center gap-2 rounded-xl border border-accent/15 bg-accent-soft px-3 py-2 text-xs font-bold text-accent transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 sm:flex" title="Download AeroSense Android App">
              <Download className="h-3.5 w-3.5" />
              <span>Get App</span>
            </a>
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-pebble bg-white/80 text-ash shadow-sm transition hover:border-accent/25 hover:bg-white hover:text-accent sm:flex" title="Notifications">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
