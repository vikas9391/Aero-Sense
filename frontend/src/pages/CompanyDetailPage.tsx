import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { companiesApi } from '../services/api';
import { CompanySummary, User } from '../types';
import {
  Building2,
  ArrowLeft,
  Users,
  Plane,
  Cpu,
  Wrench,
  ScanLine,
  Mail,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Ban,
  PlayCircle,
} from 'lucide-react';

const roleBadgeClass = (role: string) => {
  switch (role) {
    case 'COMPANY_ADMIN':
      return 'bg-indigo-50/60 text-indigo-600 border-indigo-200/50';
    case 'MANUFACTURER':
      return 'bg-sky-50/60 text-sky-600 border-sky-200/50';
    case 'MAINTENANCE_TECHNICIAN':
      return 'bg-amber-50/60 text-amber-600 border-amber-200/50';
    case 'INSPECTOR':
      return 'bg-purple-50/60 text-purple-600 border-purple-200/50';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-300';
  }
};

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const companyId = id ? parseInt(id, 10) : null;

  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    Promise.all([companiesApi.getById(companyId), companiesApi.listUsers(companyId)])
      .then(([companyData, usersData]) => {
        setCompany(companyData);
        setUsers(usersData);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load company'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleToggleStatus = async () => {
    if (!company) return;
    const nextStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg =
      nextStatus === 'SUSPENDED'
        ? `Suspend "${company.name}"? Every user at this company will be immediately blocked from signing in until reactivated.`
        : `Reactivate "${company.name}"? Users will be able to sign in again.`;
    if (!window.confirm(confirmMsg)) return;

    setUpdatingStatus(true);
    setError(null);
    try {
      const updated = await companiesApi.updateStatus(company.id, nextStatus);
      setCompany({ ...company, status: updated.status, updated_at: updated.updated_at });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update company status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500 text-sm">Loading company details...</div>;
  if (!company) {
    return (
      <div className="space-y-6">
        <Link to="/companies" className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Company Management</span>
        </Link>
        <div className="py-12 text-center text-rose-600 text-sm">
          {error || 'Company not found.'}
        </div>
      </div>
    );
  }

  const isActive = company.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Company Management</span>
      </Link>

      {error && (
        <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-3 text-xs text-rose-600 border border-rose-200/60">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Company header banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden border-indigo-200/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-600 shadow-lg shadow-indigo-500/10">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-900">{company.name}</h1>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                    isActive
                      ? 'bg-emerald-50/60 text-emerald-600 border-emerald-200/40'
                      : 'bg-rose-50/60 text-rose-600 border-rose-200/40'
                  }`}
                >
                  {company.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1 font-mono">{company.slug}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className={`flex items-center space-x-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg disabled:opacity-50 ${
                isActive
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-rose-500/20 hover:from-rose-500 hover:to-rose-600'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600'
              }`}
            >
              {isActive ? <Ban className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              <span>{updatingStatus ? 'Updating...' : isActive ? 'Suspend Company' : 'Reactivate Company'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-200/60 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>{company.user_count} users</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Plane className="h-3.5 w-3.5 text-indigo-600" />
            <span>{company.aircraft_count} aircraft</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Cpu className="h-3.5 w-3.5 text-indigo-600" />
            <span>{company.component_count} components</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Wrench className="h-3.5 w-3.5 text-indigo-600" />
            <span>{company.maintenance_count} records</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500">
            <ScanLine className="h-3.5 w-3.5 text-indigo-600" />
            <span>{company.verification_count} scans</span>
          </div>
        </div>

        {!isActive && (
          <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-3 text-xs text-rose-600 border border-rose-200/60 mt-4">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              This company is suspended — none of its users can sign in until it's reactivated. Its
              data is untouched and will be exactly as it was once you reactivate it.
            </span>
          </div>
        )}
      </div>

      {/* Users list */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center space-x-2">
          <Users className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Users at {company.name}</h2>
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No users yet — use "Add Admin" from the company list to provision the first one.
          </div>
        ) : (
          <div className="divide-y divide-slate-200/60">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                    <Mail className="h-3 w-3" />
                    <span>{u.email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`rounded px-2.5 py-1 text-xs font-mono border ${roleBadgeClass(u.role)}`}>
                    {u.role}
                  </span>
                  <span className="flex items-center space-x-1 text-xs text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
