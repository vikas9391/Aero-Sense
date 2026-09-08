import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Building2, ArrowRight, AlertCircle, ShieldCheck, ScanLine, Database, Activity, LogIn } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { AeroLogo } from '../components/Logo';

export const LoginPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, loginAsDemoSuperAdmin } = useAuth();
  const navigate = useNavigate();

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

  const handleDemoLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const user = await loginAsDemoSuperAdmin();
      navigate(user.role === 'SUPER_ADMIN' ? '/companies' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Super Admin demo access is not enabled on the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-medium text-slate-900 caret-indigo-600 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f6f8fc] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_8%,rgba(99,102,241,.13),transparent_28%),radial-gradient(circle_at_92%_14%,rgba(37,99,235,.10),transparent_27%),linear-gradient(135deg,#fafbff_0%,#f3f6ff_52%,#eef5ff_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(79,70,229,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.045)_1px,transparent_1px)] [background-size:64px_64px]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-8 lg:px-12">
        <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white bg-white/75 shadow-[0_35px_100px_rgba(51,52,105,.14)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1fr_450px]">
            <section className="hidden min-h-[650px] flex-col justify-between bg-slate-950 p-10 text-white lg:flex xl:p-14">
              <AeroLogo size="md" dark />
              <div className="max-w-xl py-10">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Aviation intelligence platform</div>
                <h1 className="font-display text-5xl font-semibold leading-[.98] tracking-[-.045em] xl:text-7xl">Trust every<br /><span className="text-indigo-300">component.</span></h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-white/50">Connect physical component identity, NFC verification and maintenance history through one secure operational command center.</p>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[{ icon: ScanLine, title: 'Verify', text: 'NFC identity' }, { icon: Database, title: 'Trace', text: 'Lifecycle records' }, { icon: ShieldCheck, title: 'Protect', text: 'Audit integrity' }].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><Icon className="h-4 w-4 text-indigo-300" /><div className="mt-5 text-sm font-bold">{title}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{text}</div></div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-[.18em] text-white/25"><span>Secure component intelligence</span><span>AERO-SENSE / 2026</span></div>
            </section>

            <section className="bg-white p-6 sm:p-10 lg:p-11">
              <div className="mb-8 lg:hidden"><AeroLogo size="md" /></div>
              <div className="mb-7">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-indigo-600"><Activity className="h-3.5 w-3.5" /> Secure access</div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">Welcome back.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to your AeroSense command center.</p>
              </div>

              {error && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="company" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-slate-700">Company name</label>
                  <div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="company" type="text" required autoComplete="organization" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" className={`${inputClass} pl-11`} /></div>
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-slate-700">Email address</label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={`${inputClass} pl-11`} /></div>
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-slate-700">Password</label>
                  <PasswordInput id="password" value={password} onChange={setPassword} required autoComplete="current-password" placeholder="Enter your password" />
                </div>
                <button type="submit" disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-50"><span>{submitting ? 'Authenticating...' : 'Enter Command Center'}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
              </form>

              <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Hackathon access</span><div className="h-px flex-1 bg-slate-200" /></div>
              <button type="button" onClick={handleDemoLogin} disabled={submitting} className="group flex w-full items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3.5 text-left transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-50"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 shadow-sm"><LogIn className="h-4 w-4" /></span><span><span className="block text-xs font-bold text-slate-900">Continue as Super Admin</span><span className="mt-0.5 block text-[10px] text-slate-500">One-click demo access</span></span></span><ArrowRight className="h-4 w-4 text-indigo-500 transition-transform group-hover:translate-x-1" /></button>

              <div className="mt-7 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Protected access</span><span>Encrypted session</span></div>
                <button type="button" onClick={() => navigate('/')} className="mt-4 w-full text-center text-[10px] font-bold uppercase tracking-[.13em] text-slate-400 transition hover:text-indigo-600">Back to AeroSense</button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
