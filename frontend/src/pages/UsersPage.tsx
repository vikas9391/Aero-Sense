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

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await usersApi.create({ name, email, password, role });
      showToast('User created successfully', 'success');
      setName(''); setEmail(''); setPassword(''); setRole('VIEWER'); setShowCreate(false);
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const statusTone = (status: string): BadgeTone => status === 'ACTIVE' ? 'success' : status === 'SUSPENDED' ? 'warning' : 'danger';

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage accounts belonging to your company." action={<button className="btn-primary" onClick={() => setShowCreate(v => !v)}><UserPlus size={18} /> Add user</button>} />

      {showCreate && (
        <Card>
          <CardHeader title="Create account" />
          <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
            <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <PasswordInput value={password} onChange={setPassword} placeholder="Password" />
            <select className="input" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              {ROLES.map(item => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create account'}</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Your Company’s Accounts" />
        {loading ? <div className="p-8 text-center">Loading users…</div> : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground"><AlertCircle className="mx-auto mb-2" />No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody>{users.map(user => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="p-3"><div className="font-semibold">{user.name}</div><div className="text-muted-foreground">{user.email}</div></td>
                  <td className="p-3"><Badge>{user.role.replaceAll('_', ' ')}</Badge></td>
                  <td className="p-3"><Badge tone={statusTone(user.status)}>{user.status}</Badge></td>
                  <td className="p-3 text-right"><UserActionMenu user={user} onChanged={updated => setUsers(current => current.map(item => item.id === updated.id ? updated : item))} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={15} /> Account deletion is handled as a soft delete so operational history is retained.</div>
    </div>
  );
}
