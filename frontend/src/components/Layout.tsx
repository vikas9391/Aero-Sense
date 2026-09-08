import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="aero-app-shell min-h-screen bg-transparent text-ink flex flex-col font-body">
      <Navbar />
      <div className="flex flex-1 min-w-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        {mobileNavOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[min(88vw,22rem)] lg:hidden">
              <div className="relative h-full">
                <Sidebar />
                <button
                  type="button"
                  aria-label="Close navigation"
                  className="absolute right-3 top-3 rounded-xl border border-pebble bg-white/90 p-2 text-ash shadow-lg backdrop-blur"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
        <main className="relative flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <button
            type="button"
            aria-label="Open navigation"
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-pebble bg-white/85 px-3.5 py-2.5 text-xs font-bold text-ink shadow-sm backdrop-blur lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4 text-accent" />
            Menu
          </button>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
