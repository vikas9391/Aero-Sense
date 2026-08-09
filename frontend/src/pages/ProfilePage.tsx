import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Shield, Mail, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ['Onboard Companies', 'Provision Company Admins', 'View Cross-Company Work Summaries'],
    COMPANY_ADMIN: ['Manage Company Users & Roles', 'View Company Work Analytics', 'Register Aircraft', 'Register Component', 'Bind NFC/RFID Tags', 'Log Maintenance Records', 'Execute NFC Verification', 'Access Security Audits'],
    MANUFACTURER: ['Register Component', 'Bind NFC/RFID Tags', 'Execute NFC Verification', 'View Fleet'],
    MAINTENANCE_TECHNICIAN: ['Log Maintenance Records', 'Execute NFC Verification', 'View Fleet & Components'],
    INSPECTOR: ['Execute NFC Verification', 'Access Security Audits', 'View Fleet & Components'],
    VIEWER: ['View Fleet & Components'],
  };

  const perms = rolePermissions[user.role] || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <UserIcon className="h-7 w-7 text-sky-400" />
          <span>User Profile & Permissions</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Current authenticated user identity and role-based access control (RBAC) rights.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white font-bold text-2xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span>{user.email}</span>
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 rounded-full bg-sky-950 px-3 py-0.5 text-xs font-extrabold text-sky-400 border border-sky-800/60">
              <Shield className="h-3.5 w-3.5" />
              <span>ROLE: {user.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Role-Based System Permissions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perms.map((p, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Account UUID: {user.uuid}</span>
          <span className="font-mono text-indigo-400">JWT Authenticated Session</span>
        </div>
      </div>
    </div>
  );
};
