import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ScanLine,
  Plane,
  Cpu,
  Tag,
  Wrench,
  ShieldAlert,
  User,
  PlusCircle,
  Users,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const canRegister = role === 'ADMIN' || role === 'MANUFACTURER';
  const canMaintain = role === 'ADMIN' || role === 'MAINTENANCE_TECHNICIAN';
  const isAdmin = role === 'ADMIN';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verify', label: 'Verify Component', icon: ScanLine, highlight: true },
    { to: '/aircraft', label: 'Aircraft Fleet', icon: Plane },
    { to: '/components', label: 'Component Catalog', icon: Cpu },
  ];

  const managementItems = [
    ...(canRegister
      ? [
          { to: '/components/register', label: 'Register Component', icon: PlusCircle },
          { to: '/nfc/register', label: 'Bind NFC / RFID Tag', icon: Tag },
        ]
      : []),
    ...(canMaintain ? [{ to: '/maintenance', label: 'Log Maintenance', icon: Wrench }] : []),
    ...(isAdmin ? [{ to: '/users', label: 'User Management', icon: Users }] : []),
    { to: '/security', label: 'Security & Audit', icon: ShieldAlert },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-slate-800/80 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Core Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/10'
                        : item.highlight
                        ? 'text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-800/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Management & Audit
          </div>
          <nav className="space-y-1">
            {managementItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs">
        <div className="font-semibold text-slate-300 mb-1">NTAG 424 DNA Support</div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Supports dynamic AES CMAC authentication and TagTamper evidence verification.
        </p>
      </div>
    </aside>
  );
};
