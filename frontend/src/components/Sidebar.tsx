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
    <div className="aero-eyebrow px-3 mb-2 text-[10px]">{title}</div>
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[#f1f1ef] text-ink'
                  : item.highlight
                  ? 'text-[#0a7a4c] hover:bg-[#e9f6ef]'
                  : 'text-[#4b4b52] hover:bg-[#f7f7f5] hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-ink' : item.highlight ? 'text-[#0a7a4c]' : 'text-ash group-hover:text-ink'
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
      <aside className="w-64 shrink-0 bg-white border-r border-pebble p-4 flex flex-col justify-between sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
        <NavGroup
          title="Platform Administration"
          items={[
            { to: '/companies', label: 'Companies', icon: Building2 },
            { to: '/profile', label: 'My Profile', icon: User },
          ]}
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
    <aside className="w-64 shrink-0 bg-white border-r border-pebble p-4 flex flex-col justify-between sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
      <div className="space-y-7">
        <NavGroup title="Core Operations" items={coreItems} />
        {managementItems.length > 0 && <NavGroup title="Management & Audit" items={managementItems} />}
      </div>

      <div className="space-y-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-[#f1f1ef] text-ink' : 'text-[#4b4b52] hover:bg-[#f7f7f5] hover:text-ink'
            }`
          }
        >
          <User className="h-4 w-4 shrink-0 text-ash" />
          <span>My Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
