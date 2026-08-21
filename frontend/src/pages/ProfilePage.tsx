import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Shield, Mail, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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
    SUPER_ADMIN: ['Onboard Companies', 'Provision Company Admins', 'View Company Users & Emails', 'Suspend/Reactivate Companies', 'View Cross-Company Work Summaries'],
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
      <PageHeader eyebrow="Account" title="User Profile & Permissions" />

      <Card className="p-8 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-pebble">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white font-semibold text-2xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">{user.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-ash mt-1">
              <Mail className="h-3.5 w-3.5" />
              <span>{user.email}</span>
            </div>
            <div className="mt-2">
              <Badge tone="info">
                <Shield className="h-3.5 w-3.5" />
                <span>ROLE: {user.role}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="aero-eyebrow">Role-Based System Permissions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perms.map((p, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 p-3 rounded-xl border border-pebble bg-[var(--status-verified-soft)]/30 text-xs text-ink">
                <CheckCircle2 className="h-4 w-4 text-[#0a7a4c] shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-pebble text-xs text-ash flex items-center justify-between">
          <span className="aero-mono">Account UUID: {user.uuid}</span>
        </div>
      </Card>

      <Card className="p-8 space-y-5">
        <CardHeader
          title="Change Password"
          icon={KeyRound}
          className="mb-0"
        />
        <p className="text-xs text-ash -mt-3">
          Update your account password. This is required for new accounts still using a temporary password.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {pwError && (
            <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-critical-soft)] p-3 text-sm text-[var(--status-critical)] border border-[#f0cbc7]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-verified-soft)] p-3 text-sm text-[var(--status-verified)] border border-[#c9e8d7]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="aero-eyebrow">Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              required
              autoComplete="current-password"
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-2">
            <label className="aero-eyebrow">New Password</label>
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
            <label className="aero-eyebrow">Confirm New Password</label>
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
            className="pill-btn pill-btn-primary text-sm disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Card>
    </div>
  );
};
