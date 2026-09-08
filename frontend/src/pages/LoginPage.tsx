import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Building2, ArrowRight, AlertCircle, ShieldCheck, ScanLine, Database, Activity } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    try { const user = await login(companyName, email, password); navigate(user.role === 'SUPER_ADMIN' ? '/companies' : '/dashboard'); }
    catch (err: any) { setError(err.response?.data?.error?.message || 'Authentication failed. Please check your credentials.'); }
    finally { setSubmitting(false); }
  };

  const fieldClass = 'w-full rounded-2xl border border-white/10 bg-white/[.055] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-accent/60 focus:bg-white/[.08] focus:ring-4 focus:ring-accent/10';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#061117] font-body text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(23,105,255,.28),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(11,155,131,.16),transparent_27%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.1] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <div className="flex items-center gap-3"><AeroLogo size="md" /><span className="h-1.5 w-1.5 rounded-full bg-good shadow-[0_0_14px_rgba(11,155,131,.9)]" /></div>
          <div className="max-w-2xl pb-6">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-white/55 backdrop-blur"><Activity className="h-3.5 w-3.5 text-good" /> Aviation intelligence platform</div>
            <h1 className="font-display text-6xl font-semibold leading-[.94] tracking-[-.05em] text-white xl:text-8xl">Know the part.<br /><span className="text-white/35">Trust the history.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/50">AeroSense gives aircraft teams a live, verifiable layer of identity, maintenance and traceability for every critical component.</p>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[{ icon: ScanLine, value: 'NFC', label: 'Physical identity' }, { icon: Database, value: 'Trace', label: 'Lifecycle history' }, { icon: ShieldCheck, value: 'Secure', label: 'Audit-ready records' }].map(({ icon: Icon, value, label }) => <div key={value} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"><Icon className="h-4 w-4 text-accent" /><div className="mt-7 font-display text-lg font-semibold">{value}</div><div className="mt-1 text-[10px] uppercase tracking-[.13em] text-white/30">{label}</div></div>)}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[.16em] text-white/25"><span>Secure aircraft component intelligence</span><span>AERO-SENSE / 2026</span></div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8 lg:border-l lg:border-white/10 lg:bg-white/[.025] xl:p-14">
          <div className="w-full max-w-[470px]">
            <div className="mb-7 flex items-center justify-between lg:hidden"><AeroLogo size="md" /><span className="rounded-full border border-good/20 bg-good/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-good">Online</span></div>
            <div className="rounded-[30px] border border-white/10 bg-[#0b1a21]/85 p-6 shadow-[0_30px_100px_rgba(0,0,0,.4)] backdrop-blur-2xl sm:p-9">
              <div className="mb-8"><div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-accent">Secure access / 01</div><h2 className="font-display text-3xl font-semibold tracking-tight">Welcome back.</h2><p className="mt-2 text-sm leading-6 text-white/40">Sign in to your AeroSense command center.</p></div>
              {error && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-critical/20 bg-critical/10 p-3 text-sm text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[.15em] text-white/40">Company name</label><div className="relative"><Building2 className="absolute left-4 top-3.5 h-4 w-4 text-white/30" /><input type="text" required autoComplete="organization" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" className={fieldClass} /></div><p className="mt-2 text-[10px] text-white/25">Platform administrators use company name “Super Admin”.</p></div>
                <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[.15em] text-white/40">Email address</label><div className="relative"><Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/30" /><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={fieldClass} /></div></div>
                <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[.15em] text-white/40">Password</label><PasswordInput value={password} onChange={setPassword} required autoComplete="current-password" placeholder="Enter your password" leadingIcon translucent /></div>
                <button type="submit" disabled={submitting} className="group pill-btn pill-btn-primary w-full !rounded-2xl !py-3.5 disabled:cursor-wait disabled:opacity-50"><span>{submitting ? 'Authenticating...' : 'Enter Command Center'}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
              </form>
              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.13em] text-white/25"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-good" /> Protected access</span><button type="button" onClick={() => navigate('/')} className="transition hover:text-white/60">Back to AeroSense</button></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
