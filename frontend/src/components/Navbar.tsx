import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Download } from 'lucide-react';
import { AeroLogo } from './Logo';

export const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-[#f8fbfc]/90 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AeroLogo size="md" />
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">
          <div className="group flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-pebble bg-white/70 px-4 py-2.5 text-sm text-ash shadow-[0_5px_20px_rgba(7,18,24,.035)] transition focus-within:border-accent/35 focus-within:bg-white">
            <Search className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">Search aircraft, components, NFC tags or maintenance records...</span>
            <span className="ml-auto rounded-lg border border-pebble bg-cream px-2 py-1 font-mono text-[9px] font-bold text-ash">⌘ K</span>
          </div>
        </div>

        {user && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href="/aerosense.apk"
              download
              className="hidden items-center gap-2 rounded-xl border border-accent/15 bg-accent-soft px-3 py-2 text-xs font-bold text-accent transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 sm:flex"
              title="Download AeroSense Android App"
            >
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
