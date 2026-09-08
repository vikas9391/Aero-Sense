import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { User, UserRole } from '../types';
import { UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { UserActionMenu } from '../components/UserActionMenu';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge, BadgeTone } from '../components/ui/Badge';

const ROLES: UserRole[] = ['COMPANY_ADMIN', 'MANUFACTURER', 'MAINTENANCE_TECHNICIAN', 'INSPECTOR', 'VIEWER'];
const statusTone = (status: User['status']): BadgeTone => status === 'ACTIVE' ? 'verified' : status === 'SUSPENDED' ? 'warning' : 'critical';
const roleLabel = (role: UserRole) => role.replaceAll('_', ' ');

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
    usersApi.list().then(setUsers).catch((err) => {
      console.error(err);
      showToast("Couldn't load the user list. Please refresh the page.", 'error');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSuccess(null); setSubmitting(true);
    try {
      const created = await usersApi.create({ name, email, password, role });
      setSuccess(`User created — ID #${created.id} (${created.email})`);
      setName(''); setEmail(''); setPassword(''); setRole('VIEWER'); loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const replaceUser = (updated: User) => setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Team & Access" title="User Management" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 h-fit space-y-6">
          <CardHeader title="Add New User" icon={UserPlus} />
          {error && <div className="flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-3 text-xs text-[#b13a2f] border border-[#f0cbc7]"><AlertCircle className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{error}</span></div>}
          {success && <div className="flex items-center gap-3 rounded-xl bg-[#e9f6ef]/60 p-3 text-xs text-[#0a7a4c] border border-[#c9e8d7]"><span className="min-w-0 break-words">{success}</span></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><label className="aero-eyebrow text-[10px]">Full Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full min-w-0 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none" /></div>
            <div className="space-y-2"><label className="aero-eyebrow text-[10px]">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. jane@aircraft.com" className="w-full min-w-0 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none" /></div>
            <div className="space-y-2"><label className="aero-eyebrow text-[10px]">Password</label><PasswordInput value={password} onChange={setPassword} required minLength={8} placeholder="Min. 8 characters" mono /></div>
            <div className="space-y-2"><label className="aero-eyebrow text-[10px]">Role</label><select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full min-w-0 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none">{ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}</select></div>
            <button type="submit" disabled={submitting} className="pill-btn pill-btn-primary w-full text-sm disabled:opacity-50">{submitting ? 'Creating...' : 'Create User'}</button>
          </form>
        </Card>

        <Card tight className="lg:col-span-2 min-w-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-pebble flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-ash" /><h2 className="min-w-0 text-sm font-semibold text-ink truncate">Your Company's Accounts</h2></div>
          {loading ? <div className="py-12 text-center text-ash text-sm">Loading users...</div> : users.length === 0 ? <div className="py-12 px-6 text-center"><ShieldCheck className="h-8 w-8 mx-auto mb-2 text-ash" /><p className="text-sm font-medium text-ink">No team accounts yet</p><p className="mt-1 text-xs text-ash">Create the first account using the form.</p></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="text-left border-b border-pebble"><th className="aero-eyebrow text-[10px] px-4 sm:px-6 py-3">ID</th><th className="aero-eyebrow text-[10px] px-4 sm:px-6 py-3">Name</th><th className="aero-eyebrow text-[10px] px-4 sm:px-6 py-3">Email</th><th className="aero-eyebrow text-[10px] px-4 sm:px-6 py-3">Role</th><th className="aero-eyebrow text-[10px] px-4 sm:px-6 py-3">Status</th><th className="aero-eyebrow text-[10px] px-4 sm:px-6 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-pebble">
                  {users.map((u) => <tr key={u.id} className="hover:bg-[#f7f7f5]">
                    <td className="px-4 sm:px-6 py-3 aero-mono text-ash">#{u.id}</td>
                    <td className="px-4 sm:px-6 py-3 max-w-[180px] text-ink font-medium truncate" title={u.name}>{u.name}</td>
                    <td className="px-4 sm:px-6 py-3 max-w-[220px] text-ash truncate" title={u.email}>{u.email}</td>
                    <td className="px-4 sm:px-6 py-3"><span className="inline-block max-w-[190px] truncate rounded border border-pebble bg-[#f7f7f5] px-2.5 py-1 text-xs font-semibold text-ink aero-mono" title={roleLabel(u.role)}>{roleLabel(u.role)}</span></td>
                    <td className="px-4 sm:px-6 py-3"><Badge tone={statusTone(u.status)} mono>{u.status}</Badge></td>
                    <td className="px-4 sm:px-6 py-3 text-right"><div className="flex justify-end"><UserActionMenu user={u} onChanged={replaceUser} /></div></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};