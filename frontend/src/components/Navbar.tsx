import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Bell, Search } from 'lucide-react';
import { AeroLogo } from './Logo';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-pebble bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <AeroLogo size="md" />

        <div className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-pebble bg-cream px-3 py-2 text-sm text-ash shadow-sm">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search components, aircraft, or tags...</span>
            <span className="ml-auto rounded-md border border-pebble bg-white px-1.5 py-0.5 text-[9px] font-bold text-ash">⌘ K</span>
          </div>
        </div>

        {user && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button className="hidden h-9 w-9 items-center justify-center rounded-xl border border-pebble bg-white text-ash transition hover:bg-cream hover:text-ink sm:flex" title="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-3 border-l border-pebble pl-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9def2] bg-[#eeeffa] text-accent">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="text-right">
                <div className="max-w-36 truncate text-sm font-semibold text-ink">{user.name}</div>
                <div className="aero-eyebrow text-[10px]">{user.role.replace(/_/g, ' ')}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-pebble bg-white px-3 text-xs font-bold text-ash transition hover:border-critical/40 hover:bg-critical/5 hover:text-critical"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
