import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ScanLine,
  Plane,
  Cpu,
  Wrench,
  ShieldAlert,
  User,
  Users,
  Building2,
  BarChart3,
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
};

const NavGroup: React.FC<{ title: string; items: NavItem[] }> = ({ title, items }) => (
  <div>
    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {title}
    </div>
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : item.highlight
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-indigo-600' : item.highlight ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  </div>
);

const RoleFooter: React.FC<{ label: string; description: string }> = ({ label, description }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1">{label}</div>
    <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
  </div>
);

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const canMaintain = isCompanyAdmin || role === 'MAINTENANCE_TECHNICIAN';

  // The Super Admin doesn't belong to any company, so it has no aircraft,
  // components, maintenance, or verification data to show — its only job is
  // managing the tenant list itself.
  if (isSuperAdmin) {
    return (
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
        <NavGroup
          title="Platform Administration"
          items={[
            { to: '/companies', label: 'Companies', icon: Building2 },
            { to: '/profile', label: 'My Profile', icon: User },
          ]}
        />
        <RoleFooter
          label="Super Admin"
          description="Platform-level account. Can view each company's users/emails and manage subscription status, but has no access to any company's aircraft, component, or maintenance records."
        />
      </aside>
    );
  }

  const coreItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verify', label: 'Verify Component', icon: ScanLine, highlight: true },
    { to: '/aircraft', label: 'Aircraft Fleet', icon: Plane },
    { to: '/components', label: 'Component Catalog', icon: Cpu },
  ];

  // Registering a component and binding an NFC tag both live as in-page
  // actions on the Component Catalog now, rather than as their own sidebar
  // destinations — one place to manage components instead of three.
  const managementItems: NavItem[] = [
    ...(canMaintain ? [{ to: '/maintenance', label: 'Log Maintenance', icon: Wrench }] : []),
    ...(isCompanyAdmin
      ? [
          { to: '/users', label: 'User Management', icon: Users },
          { to: '/analytics', label: 'Work Analytics', icon: BarChart3 },
        ]
      : []),
    { to: '/security', label: 'Security & Audit', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)]">
      <div className="space-y-7">
        <NavGroup title="Core Operations" items={coreItems} />
        {managementItems.length > 0 && <NavGroup title="Management & Audit" items={managementItems} />}
      </div>

      <div className="space-y-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span>My Profile</span>
        </NavLink>
        <RoleFooter
          label={role?.replace(/_/g, ' ') ?? 'Account'}
          description="Every action here is scoped to your company only — no cross-tenant visibility."
        />
      </div>
    </aside>
  );
};
