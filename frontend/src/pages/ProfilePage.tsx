import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { User as UserIcon, Shield, Mail, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <UserIcon className="h-7 w-7 text-indigo-600" />
          <span>User Profile & Permissions</span>
        </h1>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-200 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-200">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20 text-white font-bold text-2xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span>{user.email}</span>
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-extrabold text-indigo-600 border border-indigo-200/60">
              <Shield className="h-3.5 w-3.5" />
              <span>ROLE: {user.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Role-Based System Permissions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perms.map((p, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white/60 text-xs text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Account UUID: {user.uuid}</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-200 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <span>Change Password</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Update your account password. This is required for new accounts still using a temporary password.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {pwError && (
            <div className="flex items-center space-x-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center space-x-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              required
              autoComplete="current-password"
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm New Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-sm transition"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
