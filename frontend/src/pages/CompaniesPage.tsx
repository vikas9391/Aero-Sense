import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companiesApi } from '../services/api';
import { CompanySummary } from '../types';
import {
  Building2,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Users,
  Plane,
  Cpu,
  Wrench,
  ScanLine,
  UserPlus,
  ChevronRight,
  X,
} from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);
  const [creatingCompany, setCreatingCompany] = useState(false);

  const [adminModalCompany, setAdminModalCompany] = useState<CompanySummary | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const loadCompanies = () => {
    setLoading(true);
    companiesApi
      .list()
      .then(setCompanies)
      .catch((err) => {
        console.error(err);
        showToast('Couldn\'t load the company list. Please refresh the page.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError(null);
    setCompanySuccess(null);
    setCreatingCompany(true);
    try {
      const created = await companiesApi.create({ name: companyName });
      setCompanySuccess(`Company created — "${created.name}"`);
      setCompanyName('');
      loadCompanies();
    } catch (err: any) {
      setCompanyError(err.response?.data?.error?.message || 'Failed to create company');
    } finally {
      setCreatingCompany(false);
    }
  };

  const openAdminModal = (company: CompanySummary) => {
    setAdminModalCompany(company);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminError(null);
    setAdminSuccess(null);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminModalCompany) return;
    setAdminError(null);
    setAdminSuccess(null);
    setCreatingAdmin(true);
    try {
      const created = await companiesApi.createAdmin(adminModalCompany.id, {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });
      setAdminSuccess(`Admin created — ${created.email}`);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      loadCompanies();
    } catch (err: any) {
      setAdminError(err.response?.data?.error?.message || 'Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Super Admin"
        title={
          <span className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-ash" />
            <span>Company Management</span>
          </span>
        }
      />
      <p className="text-sm text-ash -mt-4">
        Onboard companies onto the platform, provision each one's first admin, and manage every
        tenant's subscription status. Select a company to see its users and their emails, or
        suspend/reactivate its access. Aircraft, component, and maintenance records stay isolated
        to each company — you'll never see that operational data here.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create company form */}
        <Card className="lg:col-span-1 p-6 h-fit space-y-6">
          <CardHeader title="Onboard New Company" icon={PlusCircle} />

          {companyError && (
            <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-critical-soft)] p-3 text-xs text-[var(--status-critical)] border border-[#f0cbc7]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{companyError}</span>
            </div>
          )}
          {companySuccess && (
            <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-verified-soft)] p-3 text-xs text-[var(--status-verified)] border border-[#c9e8d7]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{companySuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="space-y-2">
              <label className="aero-eyebrow">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Falcon Airlines"
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingCompany}
              className="pill-btn pill-btn-primary w-full text-sm disabled:opacity-50"
            >
              {creatingCompany ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </Card>

        {/* Company list */}
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-pebble">
            <CardHeader title="All Companies" icon={Building2} className="mb-0" />
          </div>

          {loading ? (
            <div className="py-12 text-center text-ash text-sm">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="py-12 text-center text-ash text-sm">
              No companies yet — create the first one to get started.
            </div>
          ) : (
            <div className="divide-y divide-pebble">
              {companies.map((c) => (
                <div key={c.id} className="px-6 py-4 space-y-3 hover:bg-[var(--bg-app)] transition">
                  <div className="flex items-center justify-between">
                    <Link to={`/companies/${c.id}`} className="flex-1 min-w-0 group">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-semibold text-ink group-hover:underline">{c.name}</div>
                        <ChevronRight className="h-3.5 w-3.5 text-ash" />
                      </div>
                      <div className="text-xs text-ash aero-mono">{c.slug}</div>
                    </Link>
                    <div className="flex items-center space-x-3">
                      <Badge tone={c.status === 'ACTIVE' ? 'verified' : 'critical'} mono>
                        {c.status}
                      </Badge>
                      <button
                        onClick={() => openAdminModal(c)}
                        className="flex items-center space-x-1.5 rounded-lg border border-pebble px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--bg-app)]"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Admin</span>
                      </button>
                    </div>
                  </div>

                  <Link to={`/companies/${c.id}`} className="grid grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 text-ash">
                      <Users className="h-3.5 w-3.5" />
                      <span>{c.user_count} users</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-ash">
                      <Plane className="h-3.5 w-3.5" />
                      <span>{c.aircraft_count} aircraft</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-ash">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{c.component_count} components</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-ash">
                      <Wrench className="h-3.5 w-3.5" />
                      <span>{c.maintenance_count} records</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-ash">
                      <ScanLine className="h-3.5 w-3.5" />
                      <span>{c.verification_count} scans</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Admin Modal */}
      {adminModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                Add Admin — {adminModalCompany.name}
              </h3>
              <button
                onClick={() => setAdminModalCompany(null)}
                className="text-ash hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adminError && (
              <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-critical-soft)] p-3 text-xs text-[var(--status-critical)] border border-[#f0cbc7]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}
            {adminSuccess && (
              <div className="flex items-center space-x-3 rounded-xl bg-[var(--status-verified-soft)] p-3 text-xs text-[var(--status-verified)] border border-[#c9e8d7]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <label className="aero-eyebrow">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="aero-eyebrow">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="aero-eyebrow">Password</label>
                <PasswordInput
                  value={adminPassword}
                  onChange={setAdminPassword}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  mono
                />
              </div>
              <button
                type="submit"
                disabled={creatingAdmin}
                className="pill-btn pill-btn-primary w-full text-sm disabled:opacity-50"
              >
                {creatingAdmin ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
