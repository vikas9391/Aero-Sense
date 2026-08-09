import React, { useEffect, useState } from 'react';
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
  X,
} from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);

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
      .catch(console.error)
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
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          <span>Company Management</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Super Admin-only: onboard companies onto the platform and provision each one's
          first admin. Every company's aircraft, components, and personnel are fully
          isolated from every other company — you're only ever seeing aggregate counts here,
          never operational records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create company form */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-slate-200 h-fit space-y-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <PlusCircle className="h-4 w-4 text-blue-600" />
            <span>Onboard New Company</span>
          </h2>

          {companyError && (
            <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-3 text-xs text-rose-600 border border-rose-200/60">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{companyError}</span>
            </div>
          )}
          {companySuccess && (
            <div className="flex items-center space-x-3 rounded-xl bg-emerald-50/50 p-3 text-xs text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{companySuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Falcon Airlines"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingCompany}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-sm"
            >
              {creatingCompany ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </div>

        {/* Company list */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">All Companies</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No companies yet — create the first one to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60">
              {companies.map((c) => (
                <div key={c.id} className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.slug}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`rounded px-2.5 py-1 text-xs font-mono border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50/40 text-emerald-600 border-emerald-200/50'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}
                      >
                        {c.status}
                      </span>
                      <button
                        onClick={() => openAdminModal(c)}
                        className="flex items-center space-x-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-slate-300 hover:bg-slate-200"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Admin</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      <span>{c.user_count} users</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Plane className="h-3.5 w-3.5 text-blue-600" />
                      <span>{c.aircraft_count} aircraft</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Cpu className="h-3.5 w-3.5 text-blue-600" />
                      <span>{c.component_count} components</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Wrench className="h-3.5 w-3.5 text-blue-600" />
                      <span>{c.maintenance_count} records</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <ScanLine className="h-3.5 w-3.5 text-blue-600" />
                      <span>{c.verification_count} scans</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {adminModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md glass-card rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Add Admin — {adminModalCompany.name}
              </h3>
              <button
                onClick={() => setAdminModalCompany(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adminError && (
              <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-3 text-xs text-rose-600 border border-rose-200/60">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{adminError}</span>
              </div>
            )}
            {adminSuccess && (
              <div className="flex items-center space-x-3 rounded-xl bg-emerald-50/50 p-3 text-xs text-emerald-600 border border-emerald-200/60">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
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
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-sm"
              >
                {creatingAdmin ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
