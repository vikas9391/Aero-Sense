import React, { useEffect, useMemo, useState } from 'react';
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
  ShieldCheck,
  Activity,
  Layers3,
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
        showToast("Couldn't load the company list. Please refresh the page.", 'error');
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

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.status === 'ACTIVE').length,
    [companies],
  );
  const totalUsers = useMemo(() => companies.reduce((sum, company) => sum + company.user_count, 0), [companies]);
  const totalAircraft = useMemo(() => companies.reduce((sum, company) => sum + company.aircraft_count, 0), [companies]);

  const metrics = [
    { label: 'Total Companies', value: companies.length, icon: Building2, tone: 'aero-accent' },
    { label: 'Active Tenants', value: activeCompanies, icon: Activity, tone: 'aero-good' },
    { label: 'Users', value: totalUsers, icon: Users, tone: 'aero-info' },
    { label: 'Aircraft', value: totalAircraft, icon: Plane, tone: 'aero-accent' },
  ];

  return (
    <div className="space-y-7 pb-10">
      <PageHeader
        eyebrow="Platform Control / Super Admin"
        title={
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>Company Management</span>
          </span>
        }
        action={
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-2 text-xs font-semibold text-indigo-700">
            <Activity className="h-3.5 w-3.5" />
            Platform control active
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-[24px] border border-indigo-100 bg-gradient-to-br from-[#eef2ff] via-white to-[#eff6ff] p-5 shadow-[0_18px_55px_rgba(37,65,130,.07)] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="aero-eyebrow text-indigo-600">AeroSense tenant control</div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Manage the platform from one command surface.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Onboard companies, provision their first administrator, and monitor tenant status. Operational aircraft, component, maintenance, and verification data remains isolated inside each company.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
            <Layers3 className="h-5 w-5 text-indigo-600" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Isolation</div>
              <div className="text-sm font-semibold text-slate-800">Tenant scoped</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="aero-panel group p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="aero-eyebrow truncate">{metric.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{loading ? '—' : metric.value}</div>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ${metric.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden !p-0">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/60 px-5 py-5 sm:px-6">
            <CardHeader title="Onboard New Company" icon={PlusCircle} className="mb-0" />
            <p className="mt-2 pl-9 text-xs leading-5 text-slate-500">Create a tenant and make it available for its own administrators and operational records.</p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {companyError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{companyError}</span>
              </div>
            )}
            {companySuccess && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 text-xs text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
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
                  className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <button type="submit" disabled={creatingCompany} className="pill-btn pill-btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50">
                <PlusCircle className="h-4 w-4" />
                {creatingCompany ? 'Creating...' : 'Create Company'}
              </button>
            </form>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden !p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <CardHeader title="All Companies" icon={Building2} className="mb-0" />
              <p className="mt-1 pl-9 text-xs text-slate-500">Every tenant registered on AeroSense.</p>
            </div>
            <Badge tone="info" mono>{companies.length} TENANTS</Badge>
          </div>

          {loading ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Building2 className="h-6 w-6" /></div>
              <div className="mt-4 text-sm font-semibold text-slate-800">No companies yet</div>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Create the first tenant from the onboarding panel to start building the platform fleet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {companies.map((c) => (
                <div key={c.id} className="group p-5 transition-colors hover:bg-indigo-50/35 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <Link to={`/companies/${c.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/15">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-700">{c.name}</div>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-400 aero-mono">{c.slug}</div>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between gap-3 xl:justify-end">
                      <Badge tone={c.status === 'ACTIVE' ? 'verified' : 'critical'} mono>{c.status}</Badge>
                      <button
                        onClick={() => openAdminModal(c)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Admin</span>
                      </button>
                    </div>
                  </div>

                  <Link to={`/companies/${c.id}`} className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      { icon: Users, value: c.user_count, label: 'users' },
                      { icon: Plane, value: c.aircraft_count, label: 'aircraft' },
                      { icon: Cpu, value: c.component_count, label: 'components' },
                      { icon: Wrench, value: c.maintenance_count, label: 'records' },
                      { icon: ScanLine, value: c.verification_count, label: 'scans' },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-500 transition group-hover:border-indigo-100 group-hover:bg-white">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-500/75" />
                          <span className="truncate"><span className="font-bold text-slate-700">{stat.value}</span> {stat.label}</span>
                        </div>
                      );
                    })}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {adminModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md overflow-hidden !p-0 shadow-2xl shadow-slate-950/25">
            <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20"><UserPlus className="h-5 w-5" /></div>
                  <div>
                    <div className="aero-eyebrow text-indigo-600">Administrator provisioning</div>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">Add Admin</h3>
                    <p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-500">{adminModalCompany.name}</p>
                  </div>
                </div>
                <button onClick={() => setAdminModalCompany(null)} className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-800" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {adminError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}
              {adminSuccess && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 text-xs text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{adminSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="space-y-2">
                  <label className="aero-eyebrow">Full Name</label>
                  <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Administrator name" className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div className="space-y-2">
                  <label className="aero-eyebrow">Email</label>
                  <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@company.com" className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div className="space-y-2">
                  <label className="aero-eyebrow">Password</label>
                  <PasswordInput value={adminPassword} onChange={setAdminPassword} required minLength={8} placeholder="Min. 8 characters" mono />
                </div>
                <button type="submit" disabled={creatingAdmin} className="pill-btn pill-btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50">
                  <UserPlus className="h-4 w-4" />
                  {creatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
