import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { User, UserRole } from '../types';
import { UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';

// Company Admins can create any role within their own company except
// SUPER_ADMIN and COMPANY_ADMIN's platform-level counterpart — the backend
// enforces this too (this list is just what's offered in the UI).
const ROLES: UserRole[] = ['COMPANY_ADMIN', 'MANUFACTURER', 'MAINTENANCE_TECHNICIAN', 'INSPECTOR', 'VIEWER'];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        showToast('Couldn\'t load the user list. Please refresh the page.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const created = await usersApi.create({ name, email, password, role });
      setSuccess(`User created — ID #${created.id} (${created.email})`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Team & Access" title="User Management" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create user form */}
        <Card className="lg:col-span-1 p-6 h-fit space-y-6">
          <CardHeader title="Add New User" icon={UserPlus} />

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-3 text-xs text-[#b13a2f] border border-[#f0cbc7]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 rounded-xl bg-[#e9f6ef]/60 p-3 text-xs text-[#0a7a4c] border border-[#c9e8d7]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane@aircraft.com"
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                mono
              />
            </div>

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="pill-btn pill-btn-primary w-full text-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </Card>

        {/* User list */}
        <Card tight className="lg:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-pebble flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-ash" />
            <h2 className="text-sm font-semibold text-ink">Your Company's Accounts</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-ash text-sm">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-pebble">
                    <th className="aero-eyebrow text-[10px] px-6 py-3">ID</th>
                    <th className="aero-eyebrow text-[10px] px-6 py-3">Name</th>
                    <th className="aero-eyebrow text-[10px] px-6 py-3">Email</th>
                    <th className="aero-eyebrow text-[10px] px-6 py-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f7f7f5]">
                      <td className="px-6 py-3 aero-mono text-ash">#{u.id}</td>
                      <td className="px-6 py-3 text-ink">{u.name}</td>
                      <td className="px-6 py-3 text-ash">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className="rounded border border-pebble bg-[#f7f7f5] px-2.5 py-1 text-xs font-semibold text-ink aero-mono">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
