import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { User, UserRole } from '../types';
import { Users as UsersIcon, UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../context/ToastContext';

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
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <UsersIcon className="h-7 w-7 text-indigo-600" />
          <span>User Management</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create user form */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-slate-200 h-fit space-y-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            <span>Add New User</span>
          </h2>

          {error && (
            <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-3 text-xs text-rose-600 border border-rose-200/60">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center space-x-3 rounded-xl bg-emerald-50/50 p-3 text-xs text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane@aircraft.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
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
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        {/* User list */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Your Company's Accounts</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/40">
                      <td className="px-6 py-3 font-mono text-slate-500">#{u.id}</td>
                      <td className="px-6 py-3 text-slate-900">{u.name}</td>
                      <td className="px-6 py-3 text-slate-700">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-mono text-indigo-600 border border-slate-300">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
