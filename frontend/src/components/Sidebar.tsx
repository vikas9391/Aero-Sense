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
  Building2,
  BarChart3,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const canRegister = isCompanyAdmin || role === 'MANUFACTURER';
  const canMaintain = isCompanyAdmin || role === 'MAINTENANCE_TECHNICIAN';

  // The Super Admin doesn't belong to any company, so it has no aircraft,
  // components, maintenance, or verification data to show — its only job is
  // managing the tenant list itself.
  if (isSuperAdmin) {
    const superAdminItems = [
      { to: '/companies', label: 'Companies', icon: Building2 },
      { to: '/profile', label: 'My Profile', icon: User },
    ];

    return (
      <aside className="w-64 shrink-0 glass-panel border-r border-slate-200/80 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
        <div className="space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Platform Administration
            </div>
            <nav className="space-y-1">
              {superAdminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-600 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
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

        <div className="rounded-xl border border-slate-200/80 bg-white/50 p-3 text-xs">
          <div className="font-semibold text-slate-700 mb-1">Super Admin</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Platform-level account. Not part of any company — no access to any company's
            operational data by design.
          </p>
        </div>
      </aside>
    );
  }

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
    ...(isCompanyAdmin
      ? [
          { to: '/users', label: 'User Management', icon: Users },
          { to: '/analytics', label: 'Work Analytics', icon: BarChart3 },
        ]
      : []),
    { to: '/security', label: 'Security & Audit', icon: ShieldAlert },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-slate-200/80 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
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
                        ? 'bg-indigo-600/15 text-indigo-600 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                        : item.highlight
                        ? 'text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40 border border-emerald-200/30'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
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
                        ? 'bg-indigo-600/15 text-indigo-600 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
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

     
    </aside>
  );
};
