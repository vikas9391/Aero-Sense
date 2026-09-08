import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ScanLine, Plane, Cpu, Wrench, ShieldAlert, User, Users, BarChart3, Building2, Nfc, ChevronRight, Smartphone, LogOut } from 'lucide-react';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean };

const NavGroup: React.FC<{ title: string; items: NavItem[] }> = ({ title, items }) => (
  <div>
    <div className="mb-2 flex items-center gap-2 px-3 text-[9px] font-extrabold uppercase tracking-[.16em] text-ash"><span className="h-px w-3 bg-pebble" />{title}</div>
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return <NavLink key={item.to} to={item.to} className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 text-white shadow-[0_12px_28px_rgba(79,70,229,.20)]' : item.highlight ? 'bg-good/6 text-good hover:bg-good/10' : 'text-ash hover:bg-white hover:text-ink hover:shadow-sm'}`}>
          {({ isActive }) => <><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/15' : item.highlight ? 'bg-good/10' : 'bg-slate-100'}`}><Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.highlight ? 'text-good' : 'text-ash group-hover:text-accent'}`} /></span><span className="truncate">{item.label}</span>{isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/60" />}</>}
        </NavLink>;
      })}
    </nav>
  </div>
);

const roleLabel = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'SUPER ADMIN';
    case 'COMPANY_ADMIN': return 'COMPANY ADMIN';
    case 'MANUFACTURER': return 'MANUFACTURER';
    case 'MAINTENANCE_TECHNICIAN': return 'MAINTENANCE TECHNICIAN';
    case 'INSPECTOR': return 'INSPECTOR';
    default: return role?.replace(/_/g, ' ') || 'USER';
  }
};

const roleInitials = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'SA';
    case 'COMPANY_ADMIN': return 'CA';
    case 'MANUFACTURER': return 'MF';
    case 'MAINTENANCE_TECHNICIAN': return 'MT';
    case 'INSPECTOR': return 'IN';
    default: return 'US';
  }
};

const ProfileLogoutCard: React.FC<{ user: any; logout: () => void }> = ({ user, logout }) => (
  <div className="rounded-2xl border border-indigo-100 bg-white/90 p-3 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 text-sm font-extrabold text-white shadow-md shadow-indigo-200">{roleInitials(user?.role)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink">{user?.name || 'User'}</div>
        <div className="mt-0.5 truncate text-[9px] font-extrabold uppercase tracking-[.12em] text-accent">{roleLabel(user?.role)}</div>
      </div>
    </div>
    <button type="button" onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-violet-50 px-3 py-2.5 text-xs font-bold text-accent transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100">
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </button>
  </div>
);

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const canVerify = isCompanyAdmin || role === 'MANUFACTURER' || role === 'MAINTENANCE_TECHNICIAN' || role === 'INSPECTOR';
  const canMaintain = isCompanyAdmin || role === 'MAINTENANCE_TECHNICIAN';
  const canAudit = isCompanyAdmin || role === 'INSPECTOR';
  const shell = 'w-[17rem] shrink-0 bg-[#f7fafb]/90 border-r border-white p-4 flex flex-col justify-between sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto backdrop-blur-xl';

  const bottom = <div className="mt-auto space-y-3 pt-6"><AppDownloadCard /><ProfileLogoutCard user={user} logout={logout} /></div>;

  if (isSuperAdmin) return <aside className={shell}>
    <div className="flex min-h-full flex-col">
      <NavGroup title="Platform Administration" items={[{ to: '/companies', label: 'Companies', icon: Building2 }, { to: '/profile', label: 'My Profile', icon: User }]} />
      {bottom}
    </div>
  </aside>;

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

  return <aside className={shell}>
    <div className="flex min-h-full flex-col">
      <div className="space-y-7"><NavGroup title="Core Operations" items={coreItems} />{managementItems.length > 0 && <NavGroup title="Management & Audit" items={managementItems} />}</div>
      {bottom}
    </div>
  </aside>;
};

const AppDownloadCard: React.FC = () => (
  <a href="/aerosense.apk" download className="group block rounded-2xl border border-accent/15 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 p-3 text-white shadow-[0_14px_32px_rgba(79,70,229,.16)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,.24)]">
    <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15"><Smartphone className="h-4 w-4 text-white" /></span><div className="min-w-0 flex-1"><div className="text-xs font-bold">AeroSense Mobile</div><div className="mt-0.5 text-[10px] text-white/65">Android app · APK</div></div><span className="text-[10px] font-bold text-white/80">GET</span></div>
  </a>
);
