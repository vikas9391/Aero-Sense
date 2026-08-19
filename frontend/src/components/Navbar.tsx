import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide text-slate-900">AIR-VERIFY</span>
            <p className="text-xs text-slate-500 font-medium">Secure Aircraft Component Verification Platform</p>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 border-r border-slate-200 pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-300 text-indigo-600">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                <div className="text-[11px] font-bold text-indigo-600 tracking-wider">
                  {user.role.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50/40 hover:text-rose-600 hover:border-rose-200/60"
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
