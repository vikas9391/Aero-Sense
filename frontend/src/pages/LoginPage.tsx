import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Building2, ArrowRight, AlertCircle, ShieldCheck, ScanLine, Database, Activity, KeyRound } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { AeroLogo } from '../components/Logo';

export const LoginPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const useSuperAdminAccess = () => {
    setCompanyName('Super Admin');
    setEmail('admin@gmail.com');
    setError(null);
    document.getElementById('password')?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(companyName, email, password);
      navigate(user.role === 'SUPER_ADMIN' ? '/companies' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-[#07151d] lg:flex lg:flex-col lg:justify-between p-12 xl:p-16">
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:52px_52px]" />
          <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[110px]" />
          <div className="relative"><AeroLogo size="md" dark /></div>
          <div className="relative max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Aviation intelligence platform</div>
            <h1 className="font-display text-5xl font-semibold leading-[.98] tracking-[-.045em] text-white xl:text-7xl">Every part has a<br /><span className="text-white/35">story. Make it trusted.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/45">AeroSense connects physical component identity, NFC verification and maintenance history into one operational command center.</p>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-xl">
              {[{ icon: ScanLine, title: 'Verify', text: 'NFC identity' }, { icon: Database, title: 'Trace', text: 'Lifecycle records' }, { icon: ShieldCheck, title: 'Protect', text: 'Audit integrity' }].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><Icon className="h-4 w-4 text-blue-400" /><div className="mt-7 text-sm font-bold text-white">{title}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-white/30">{text}</div></div>
              ))}
            </div>
          </div>
          <div className="relative flex justify-between text-[9px] font-bold uppercase tracking-[.18em] text-white/25"><span>Secure component intelligence</span><span>AERO-SENSE / 2026</span></div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[480px]">
            <div className="mb-8 lg:hidden"><AeroLogo size="md" /></div>
            <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,.09)] sm:p-10">
              <div className="mb-8">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-600"><Activity className="h-3.5 w-3.5" /> Secure access</div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">Welcome back.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to your AeroSense command center.</p>
              </div>

              {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="company" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-slate-600">Company name</label>
                  <div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="company" type="text" required autoComplete="organization" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" className={`${inputClass} pl-11`} /></div>
                  <p className="mt-2 text-[11px] text-slate-400">Platform administrators use <span className="font-semibold text-slate-500">Super Admin</span>.</p>
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-slate-600">Email address</label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={`${inputClass} pl-11`} /></div>
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-slate-600">Password</label>
                  <PasswordInput id="password" value={password} onChange={setPassword} required autoComplete="current-password" placeholder="Enter your password" />
                </div>
                <button type="submit" disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-wait disabled:opacity-50"><span>{submitting ? 'Authenticating...' : 'Enter Command Center'}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
              </form>

              <button type="button" onClick={useSuperAdminAccess} className="group mt-5 flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50">
                <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><KeyRound className="h-4 w-4" /></span><span><span className="block text-xs font-bold text-slate-800">Super Admin Access</span><span className="mt-0.5 block text-[10px] text-slate-500">Fill the temporary administrator account</span></span></span><ArrowRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Protected access</span><button type="button" onClick={() => navigate('/')} className="transition hover:text-slate-700">Back to AeroSense</button></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
