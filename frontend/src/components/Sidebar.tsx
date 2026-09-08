import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ScanLine, Plane, Cpu, Wrench, ShieldAlert, User, Users, BarChart3, Building2, Nfc, ChevronRight } from 'lucide-react';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean };

const NavGroup: React.FC<{ title: string; items: NavItem[] }> = ({ title, items }) => (
  <div>
    <div className="mb-2 flex items-center gap-2 px-3 text-[9px] font-extrabold uppercase tracking-[.16em] text-ash">
      <span className="h-px w-3 bg-pebble" />{title}
    </div>
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-ink text-white shadow-[0_12px_28px_rgba(7,18,24,.14)]' : item.highlight ? 'bg-good/6 text-good hover:bg-good/10' : 'text-ash hover:bg-white hover:text-ink hover:shadow-sm'}`}
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/10' : item.highlight ? 'bg-good/10' : 'bg-slate-100'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.highlight ? 'text-good' : 'text-ash group-hover:text-accent'}`} />
                </span>
                <span className="truncate">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/50" />}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  </div>
);

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const canVerify = isCompanyAdmin || role === 'MANUFACTURER' || role === 'MAINTENANCE_TECHNICIAN' || role === 'INSPECTOR';
  const canMaintain = isCompanyAdmin || role === 'MAINTENANCE_TECHNICIAN';
  const canAudit = isCompanyAdmin || role === 'INSPECTOR';
  const shell = 'w-[17rem] shrink-0 bg-[#f7fafb]/90 border-r border-white p-4 flex flex-col justify-between sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto backdrop-blur-xl';

  if (isSuperAdmin) return (
    <aside className={shell}>
      <div className="space-y-7">
        <NavGroup title="Platform Administration" items={[{ to: '/companies', label: 'Companies', icon: Building2 }, { to: '/profile', label: 'My Profile', icon: User }]} />
      </div>
    </aside>
  );

  const coreItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(canVerify ? [{ to: '/verify', label: 'Verify Component', icon: ScanLine, highlight: true }] : []),
    { to: '/aircraft', label: 'Aircraft Fleet', icon: Plane },
    { to: '/components', label: 'Component Catalog', icon: Cpu },
  ];
  const managementItems: NavItem[] = [
    ...(canMaintain ? [{ to: '/maintenance', label: 'Log Maintenance', icon: Wrench }] : []),
    ...(isCompanyAdmin ? [{ to: '/users', label: 'User Management', icon: Users }, { to: '/analytics', label: 'Work Analytics', icon: BarChart3 }] : []),
    ...(canAudit ? [{ to: '/security', label: 'Security & Audit', icon: ShieldAlert }] : []),
  ];

  return (
    <aside className={shell}>
      <div className="space-y-7">
        <NavGroup title="Core Operations" items={coreItems} />
        {managementItems.length > 0 && <NavGroup title="Management & Audit" items={managementItems} />}
      </div>
      <div className="space-y-2.5">
        {canVerify && (
          <NavLink to="/verify" className="group flex items-center gap-3 rounded-2xl border border-accent/15 bg-accent-soft px-3 py-3 text-sm font-bold text-accent transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70"><Nfc className="h-4 w-4" /></span>
            <span className="truncate">Quick NFC Verify</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${isActive ? 'bg-white text-ink shadow-sm' : 'text-ash hover:bg-white hover:text-ink'}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100"><User className="h-4 w-4 text-ash" /></span><span className="truncate">My Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
