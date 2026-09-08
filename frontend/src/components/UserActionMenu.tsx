import React, { useEffect, useRef, useState } from 'react';
import { Activity, Ban, CheckCircle2, Eye, MoreVertical, RotateCcw, Shield, Trash2, X } from 'lucide-react';
import { usersApi } from '../services/api';
import { User, UserProfile } from '../types';
import { useToast } from '../context/ToastContext';
import { Badge, BadgeTone } from './ui/Badge';

const roleTone = (role: string): BadgeTone => {
  switch (role) {
    case 'COMPANY_ADMIN':
    case 'MANUFACTURER': return 'info';
    case 'MAINTENANCE_TECHNICIAN': return 'warning';
    case 'INSPECTOR': return 'verified';
    default: return 'neutral';
  }
};

const statusTone = (status: User['status']): BadgeTone => status === 'ACTIVE' ? 'verified' : status === 'SUSPENDED' ? 'warning' : 'critical';

interface Props {
  user: User;
  onChanged: (updated: User) => void;
}

export const UserActionMenu: React.FC<Props> = ({ user, onChanged }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const viewProfile = async () => {
    setOpen(false);
    setProfileOpen(true);
    setLoadingProfile(true);
    try {
      setProfile(await usersApi.getProfile(user.id));
    } catch (err: any) {
      setProfileOpen(false);
      showToast(err.response?.data?.error?.message || 'Unable to load this user profile.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const changeStatus = async (status: User['status']) => {
    setOpen(false);
    if (status === 'SUSPENDED' && !window.confirm(`Suspend ${user.name}'s account? They will no longer be able to sign in.`)) return;
    if (status === 'ACTIVE' && !window.confirm(`Reactivate ${user.name}'s account?`)) return;
    setBusy(true);
    try {
      const updated = await usersApi.updateStatus(user.id, status);
      onChanged(updated);
      setProfile((current) => current ? { ...current, user: updated } : current);
      showToast(status === 'SUSPENDED' ? 'User account suspended.' : 'User account reactivated.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Unable to update account status.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setOpen(false);
    if (!window.confirm(`Delete ${user.name}'s account? This disables the account while preserving their work history for audit purposes.`)) return;
    setBusy(true);
    try {
      const updated = await usersApi.remove(user.id);
      onChanged(updated);
      setProfile((current) => current ? { ...current, user: updated } : current);
      showToast('User account deleted and historical records preserved.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Unable to delete this account.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-pebble bg-white p-2 text-ash hover:bg-[#f7f7f5] hover:text-ink disabled:opacity-50"
        aria-label={`Actions for ${user.name}`}
        title="User actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-pebble bg-white p-1.5 shadow-xl">
          <button type="button" onClick={viewProfile} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7f7f5]"><Eye className="h-4 w-4" /> View profile & work</button>
          {user.status === 'ACTIVE' && <button type="button" onClick={() => changeStatus('SUSPENDED')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fff5e8]"><Ban className="h-4 w-4" /> Suspend account</button>}
          {user.status === 'SUSPENDED' && <button type="button" onClick={() => changeStatus('ACTIVE')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#e9f6ef]"><RotateCcw className="h-4 w-4" /> Reactivate account</button>}
          {user.status !== 'DELETED' && <button type="button" onClick={deleteAccount} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#b13a2f] hover:bg-[#fbeceb]"><Trash2 className="h-4 w-4" /> Delete account</button>}
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl border border-pebble bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pebble px-6 py-4">
              <div>
                <div className="aero-eyebrow text-[10px]">ACCOUNT PROFILE</div>
                <h3 className="mt-1 text-lg font-semibold text-ink">{user.name}</h3>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)} className="rounded-lg p-2 text-ash hover:bg-[#f7f7f5]" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            {loadingProfile ? <div className="py-12 text-center text-sm text-ash">Loading profile and work history...</div> : profile && (
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-pebble p-4"><div className="text-[10px] font-bold tracking-wider text-ash">EMAIL</div><div className="mt-1 text-sm font-medium text-ink break-all">{profile.user.email}</div></div>
                  <div className="rounded-xl border border-pebble p-4"><div className="text-[10px] font-bold tracking-wider text-ash">ROLE</div><div className="mt-2"><Badge tone={roleTone(profile.user.role)} mono>{profile.user.role}</Badge></div></div>
                  <div className="rounded-xl border border-pebble p-4"><div className="text-[10px] font-bold tracking-wider text-ash">STATUS</div><div className="mt-2"><Badge tone={statusTone(profile.user.status)} mono>{profile.user.status}</Badge></div></div>
                  <div className="rounded-xl border border-pebble p-4"><div className="text-[10px] font-bold tracking-wider text-ash">JOINED</div><div className="mt-1 text-sm font-medium text-ink">{new Date(profile.user.created_at).toLocaleString()}</div></div>
                </div>

                <div className="rounded-xl border border-pebble bg-[#fafaf8] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Activity className="h-4 w-4" /> Work history</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-2xl font-semibold text-ink">{profile.maintenance_count}</div><div className="text-xs text-ash">Maintenance records</div></div>
                    <div><div className="text-2xl font-semibold text-ink">{profile.component_update_count}</div><div className="text-xs text-ash">Component updates</div></div>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-ash">These counts are sourced from the user's attributed maintenance and component-update history and are retained when an account is suspended or deleted.</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-ash"><Shield className="h-3.5 w-3.5" /> Company: {profile.company_name || 'Platform / Super Admin'}</div>
              </div>
            )}

            <div className="flex justify-end border-t border-pebble px-6 py-4"><button type="button" onClick={() => setProfileOpen(false)} className="pill-btn pill-btn-secondary text-sm">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
