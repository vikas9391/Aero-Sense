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
import { Card, CardHeader } from '../components/ui/Card';
import { Badge, BadgeTone } from '../components/ui/Badge';

const roleTone = (role: string): BadgeTone => {
  switch (role) {
    case 'COMPANY_ADMIN':
      return 'info';
    case 'MANUFACTURER':
      return 'info';
    case 'MAINTENANCE_TECHNICIAN':
      return 'warning';
    case 'INSPECTOR':
      return 'verified';
    default:
      return 'neutral';
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

  if (loading) return <div className="py-12 text-center text-ash text-sm">Loading company details...</div>;
  if (!company) {
    return (
      <div className="space-y-6">
        <Link to="/companies" className="inline-flex items-center space-x-2 text-xs font-semibold text-ink hover:text-ash">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Company Management</span>
        </Link>
        <div className="py-12 text-center text-[var(--status-critical)] text-sm">
          {error || 'Company not found.'}
        </div>
      </div>
    );
  }

  const isActive = company.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center space-x-2 text-xs font-semibold text-ink hover:text-ash">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Company Management</span>
      </Link>

      {error && (
        <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-critical-soft)] p-3 text-xs text-[var(--status-critical)] border border-[#f0cbc7]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Company header banner */}
      <Card className="p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pebble bg-[var(--bg-app)] text-ink">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="font-display text-2xl font-semibold text-ink">{company.name}</h1>
                <Badge tone={isActive ? 'verified' : 'critical'} mono>
                  {company.status}
                </Badge>
              </div>
              <p className="text-sm text-ash mt-1 aero-mono">{company.slug}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleStatus}
              disabled={updatingStatus}
              className={`pill-btn text-sm disabled:opacity-50 ${
                isActive ? 'bg-[var(--status-critical)] text-white' : 'bg-[var(--status-verified)] text-white'
              }`}
            >
              {isActive ? <Ban className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              <span>{updatingStatus ? 'Updating...' : isActive ? 'Suspend Company' : 'Reactivate Company'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-pebble text-xs">
          <div className="flex items-center space-x-1.5 text-ash">
            <Users className="h-3.5 w-3.5" />
            <span>{company.user_count} users</span>
          </div>
          <div className="flex items-center space-x-1.5 text-ash">
            <Plane className="h-3.5 w-3.5" />
            <span>{company.aircraft_count} aircraft</span>
          </div>
          <div className="flex items-center space-x-1.5 text-ash">
            <Cpu className="h-3.5 w-3.5" />
            <span>{company.component_count} components</span>
          </div>
          <div className="flex items-center space-x-1.5 text-ash">
            <Wrench className="h-3.5 w-3.5" />
            <span>{company.maintenance_count} records</span>
          </div>
          <div className="flex items-center space-x-1.5 text-ash">
            <ScanLine className="h-3.5 w-3.5" />
            <span>{company.verification_count} scans</span>
          </div>
        </div>

        {!isActive && (
          <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-critical-soft)] p-3 text-xs text-[var(--status-critical)] border border-[#f0cbc7] mt-4">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              This company is suspended — none of its users can sign in until it's reactivated. Its
              data is untouched and will be exactly as it was once you reactivate it.
            </span>
          </div>
        )}
      </Card>

      {/* Users list */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-pebble">
          <CardHeader title={`Users at ${company.name}`} icon={Users} className="mb-0" />
        </div>

        {users.length === 0 ? (
          <div className="py-12 text-center text-ash text-sm">
            No users yet — use "Add Admin" from the company list to provision the first one.
          </div>
        ) : (
          <div className="divide-y divide-pebble">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink">{u.name}</div>
                  <div className="flex items-center space-x-1.5 text-xs text-ash mt-0.5">
                    <Mail className="h-3 w-3" />
                    <span>{u.email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge tone={roleTone(u.role)} mono>
                    {u.role}
                  </Badge>
                  <span className="flex items-center space-x-1 text-xs text-ash">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
