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
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <Building2 className="h-7 w-7 text-sky-400" />
          <span>Company Management</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Super Admin-only: onboard companies onto the platform and provision each one's
          first admin. Every company's aircraft, components, and personnel are fully
          isolated from every other company — you're only ever seeing aggregate counts here,
          never operational records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create company form */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-slate-800 h-fit space-y-6">
          <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <PlusCircle className="h-4 w-4 text-sky-400" />
            <span>Onboard New Company</span>
          </h2>

          {companyError && (
            <div className="flex items-center space-x-3 rounded-xl bg-rose-950/50 p-3 text-xs text-rose-300 border border-rose-800/60">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{companyError}</span>
            </div>
          )}
          {companySuccess && (
            <div className="flex items-center space-x-3 rounded-xl bg-emerald-950/50 p-3 text-xs text-emerald-300 border border-emerald-800/60">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{companySuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Falcon Airlines"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingCompany}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-sm"
            >
              {creatingCompany ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </div>

        {/* Company list */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-100">All Companies</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No companies yet — create the first one to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {companies.map((c) => (
                <div key={c.id} className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.slug}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`rounded px-2.5 py-1 text-xs font-mono border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                      <button
                        onClick={() => openAdminModal(c)}
                        className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-400 border border-slate-700 hover:bg-slate-700"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Admin</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                      <span>{c.user_count} users</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Plane className="h-3.5 w-3.5 text-sky-400" />
                      <span>{c.aircraft_count} aircraft</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Cpu className="h-3.5 w-3.5 text-sky-400" />
                      <span>{c.component_count} components</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Wrench className="h-3.5 w-3.5 text-sky-400" />
                      <span>{c.maintenance_count} records</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <ScanLine className="h-3.5 w-3.5 text-sky-400" />
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
          <div className="w-full max-w-md glass-card rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">
                Add Admin — {adminModalCompany.name}
              </h3>
              <button
                onClick={() => setAdminModalCompany(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adminError && (
              <div className="flex items-center space-x-3 rounded-xl bg-rose-950/50 p-3 text-xs text-rose-300 border border-rose-800/60">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{adminError}</span>
              </div>
            )}
            {adminSuccess && (
              <div className="flex items-center space-x-3 rounded-xl bg-emerald-950/50 p-3 text-xs text-emerald-300 border border-emerald-800/60">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={creatingAdmin}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-sm"
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
