import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, Radio, Lock } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-slate-800/80 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-wide text-slate-100">AIR-VERIFY</span>
              <span className="rounded bg-sky-950/80 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-800/50">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Secure Aircraft Component Verification Platform</p>
          </div>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-2 rounded-full bg-emerald-950/40 px-3.5 py-1 text-xs text-emerald-400 border border-emerald-800/50">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">NFC Security Engine Active</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Radio className="h-3.5 w-3.5 text-indigo-400" />
            <span>Mode: <strong className="text-slate-200">Mock Hardware</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Blockchain: <strong className="text-slate-200">SHA-256 Digest Active</strong></span>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 border-r border-slate-800 pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sky-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-200">{user.name}</div>
                <div className="text-[11px] font-bold text-sky-400 tracking-wider">
                  {user.role}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/60"
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
