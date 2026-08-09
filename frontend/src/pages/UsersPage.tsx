import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { User, UserRole } from '../types';
import { Users as UsersIcon, UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

// Company Admins can create any role within their own company except
// SUPER_ADMIN and COMPANY_ADMIN's platform-level counterpart — the backend
// enforces this too (this list is just what's offered in the UI).
const ROLES: UserRole[] = ['COMPANY_ADMIN', 'MANUFACTURER', 'MAINTENANCE_TECHNICIAN', 'INSPECTOR', 'VIEWER'];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
      .catch(console.error)
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
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <UsersIcon className="h-7 w-7 text-sky-400" />
          <span>User Management</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Company Admin-only: create accounts within your own company. Everyone you add here
          is scoped to your company and can never see another company's data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create user form */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-slate-800 h-fit space-y-6">
          <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <UserPlus className="h-4 w-4 text-sky-400" />
            <span>Add New User</span>
          </h2>

          {error && (
            <div className="flex items-center space-x-3 rounded-xl bg-rose-950/50 p-3 text-xs text-rose-300 border border-rose-800/60">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center space-x-3 rounded-xl bg-emerald-950/50 p-3 text-xs text-emerald-300 border border-emerald-800/60">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane@aircraft.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
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
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        {/* User list */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-100">Your Company's Accounts</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="px-6 py-3 font-mono text-slate-400">#{u.id}</td>
                      <td className="px-6 py-3 text-slate-100">{u.name}</td>
                      <td className="px-6 py-3 text-slate-300">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-sky-400 border border-slate-700">
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
