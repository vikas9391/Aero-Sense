import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ScanLine, Plane, Cpu, Wrench, ShieldAlert, User, Users, BarChart3, Building2, Nfc } from 'lucide-react';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean };

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
            className={({ isActive }) => `group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? 'bg-[#eeeffa] text-[#34439b] shadow-sm' : item.highlight ? 'text-[#16856d] hover:bg-[#e8f5f0]' : 'text-[#77746f] hover:bg-[#f8f6f2] hover:text-[#242321]'}`}
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#34439b]' : item.highlight ? 'text-[#16856d]' : 'text-[#77746f] group-hover:text-[#242321]'}`} />
                <span className="truncate">{item.label}</span>
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
  const shell = 'w-64 shrink-0 bg-white border-r border-pebble p-4 flex flex-col justify-between sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto';

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
      <div className="space-y-3">
        {canVerify && (
          <NavLink to="/verify" className="flex items-center gap-3 rounded-xl border border-[#d9def2] bg-[#eeeffa] px-3 py-2.5 text-sm font-bold text-accent transition hover:shadow-sm">
            <Nfc className="h-4 w-4 shrink-0" />
            <span className="truncate">Quick NFC Verify</span>
          </NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => `flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-[#eeeffa] text-[#34439b]' : 'text-[#77746f] hover:bg-[#f8f6f2] hover:text-[#242321]'}`}>
          <User className="h-4 w-4 shrink-0 text-ash" /><span className="truncate">My Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
