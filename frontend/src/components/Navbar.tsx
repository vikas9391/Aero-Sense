import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plane, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-pebble bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-[0_6px_16px_rgba(52,67,155,.18)]">
            <Plane className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <span className="font-display block truncate text-base font-semibold tracking-tight text-ink">AERO-SENSE</span>
            <p className="hidden truncate text-[11px] font-medium text-ash sm:block">Aircraft Component Verification Platform</p>
          </div>
        </div>

        {user && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-3 border-r border-pebble pr-4 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-pebble bg-cream text-ink">
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
