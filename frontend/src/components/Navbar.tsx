import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plane, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-pebble bg-white/95 px-6 py-3.5 backdrop-blur">
      <div className="flex items-center justify-between">
        {/* Left: Brand identity — matches the landing page's ink mark instead
            of the old indigo gradient tile. */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
            <Plane className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-display text-base font-semibold tracking-tight text-ink">AERO-SENSE</span>
            <p className="text-[11px] font-medium text-ash">Aircraft Component Verification Platform</p>
          </div>
        </div>

        {/* Right: user identity & sign out */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-pebble pr-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-pebble bg-[#f7f7f5] text-ink">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-ink">{user.name}</div>
                <div className="aero-eyebrow text-[10px]">{user.role.replace(/_/g, ' ')}</div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 rounded-lg border border-pebble bg-white px-3 py-2 text-xs font-medium text-ash transition hover:border-[#b13a2f]/40 hover:bg-[#fbeceb] hover:text-[#b13a2f]"
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
