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

  const inputClass = 'w-full rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3.5 text-[15px] font-medium text-white placeholder:text-white/35 outline-none transition focus:border-blue-300/70 focus:bg-white/[0.11] focus:ring-4 focus:ring-blue-400/10';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#061521] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,235,.25),transparent_30%),radial-gradient(circle_at_88%_88%,rgba(20,184,166,.14),transparent_32%),linear-gradient(135deg,#061521_0%,#0a2130_48%,#102d3c_100%)]" />
      <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
      <div className="absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[130px]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-5xl rounded-[34px] border border-white/15 bg-white/[0.06] p-2 shadow-[0_40px_120px_rgba(0,0,0,.38)] backdrop-blur-2xl sm:p-3">
          <div className="grid overflow-hidden rounded-[27px] border border-white/10 bg-gradient-to-br from-[#0b2534]/95 via-[#0a1e2b]/95 to-[#102d3b]/95 lg:grid-cols-[1fr_450px]">
            <section className="hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
              <AeroLogo size="md" dark />
              <div className="max-w-xl py-12">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Aviation intelligence platform</div>
                <h1 className="font-display text-5xl font-semibold leading-[.98] tracking-[-.045em] text-white xl:text-7xl">Trust every<br /><span className="bg-gradient-to-r from-blue-200 via-white to-cyan-200 bg-clip-text text-transparent">component.</span></h1>
                <p className="mt-7 max-w-lg text-base leading-7 text-white/55">Connect physical component identity, NFC verification and maintenance history through one secure operational command center.</p>
                <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                  {[{ icon: ScanLine, title: 'Verify', text: 'NFC identity' }, { icon: Database, title: 'Trace', text: 'Lifecycle records' }, { icon: ShieldCheck, title: 'Protect', text: 'Audit integrity' }].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[.055] p-4"><Icon className="h-4 w-4 text-blue-300" /><div className="mt-7 text-sm font-bold text-white">{title}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{text}</div></div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-[.18em] text-white/25"><span>Secure component intelligence</span><span>AERO-SENSE / 2026</span></div>
            </section>

            <section className="border-white/10 bg-white/[0.045] p-6 sm:p-9 lg:border-l lg:p-10 xl:p-12">
              <div className="mb-8 lg:hidden"><AeroLogo size="md" dark /></div>
              <div className="mb-8">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-200"><Activity className="h-3.5 w-3.5" /> Secure access</div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-white">Welcome back.</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">Sign in to your AeroSense command center.</p>
              </div>
              {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label htmlFor="company" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-white/65">Company name</label><div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input id="company" type="text" required autoComplete="organization" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" className={`${inputClass} pl-11`} /></div></div>
                <div><label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-white/65">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={`${inputClass} pl-11`} /></div></div>
                <div><label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-[.13em] text-white/65">Password</label><PasswordInput id="password" value={password} onChange={setPassword} required autoComplete="current-password" placeholder="Enter your password" /></div>
                <button type="submit" disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-400 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 disabled:cursor-wait disabled:opacity-50"><span>{submitting ? 'Authenticating...' : 'Enter Command Center'}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
              </form>
              <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="text-[9px] font-bold uppercase tracking-[.16em] text-white/25">or</span><div className="h-px flex-1 bg-white/10" /></div>
              <button type="button" onClick={handleDemoLogin} disabled={submitting} className="group flex w-full items-center justify-between rounded-2xl border border-blue-300/15 bg-blue-400/[0.08] px-4 py-3.5 text-left transition hover:border-blue-300/30 hover:bg-blue-400/[0.13] disabled:cursor-wait disabled:opacity-50"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.08] text-blue-200"><LogIn className="h-4 w-4" /></span><span><span className="block text-xs font-bold text-white">Continue as Super Admin</span><span className="mt-0.5 block text-[10px] text-white/40">No password entry required</span></span></span><ArrowRight className="h-4 w-4 text-blue-300 transition-transform group-hover:translate-x-1" /></button>
              <div className="mt-8 space-y-4 border-t border-white/10 pt-6"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.13em] text-white/35"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Protected access</span><span>Encrypted session</span></div><button type="button" onClick={() => navigate('/')} className="w-full text-center text-[10px] font-bold uppercase tracking-[.13em] text-white/35 transition hover:text-white/70">Back to AeroSense</button></div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
