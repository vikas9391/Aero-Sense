import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { PasswordInput } from '../components/PasswordInput';
import { AeroLogo } from '../components/Logo';
import showcaseImage from '../assets/aero-sense-showcase.webp';

export const LoginPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
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

  const form = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center space-x-3 rounded-xl border border-[#f0cbc7] bg-[var(--status-critical-soft)] p-4 text-sm text-[var(--status-critical)]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="aero-eyebrow">Company Name</label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-3 h-5 w-5 text-ash" />
          <input type="text" required autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company Name" className="w-full rounded-xl border border-pebble bg-white/90 pl-11 pr-4 py-2.5 text-sm text-ink placeholder-ash focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10" />
        </div>
        <p className="text-[11px] text-ash">Platform administrators sign in with company name "Super Admin".</p>
      </div>

      <div className="space-y-2">
        <label className="aero-eyebrow">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-3 h-5 w-5 text-ash" />
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-xl border border-pebble bg-white/90 pl-11 pr-4 py-2.5 text-sm text-ink placeholder-ash focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="aero-eyebrow">Password</label>
        <PasswordInput value={password} onChange={setPassword} required autoComplete="current-password" placeholder="Enter your password" leadingIcon translucent />
      </div>

      <button type="submit" disabled={submitting} className="pill-btn pill-btn-primary w-full text-sm disabled:opacity-50">
        <span>{submitting ? 'Authenticating...' : 'Sign In to Platform'}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );

  const brand = (
    <div className="space-y-2 text-center">
      <div className="flex justify-center">
        <AeroLogo size="lg" showWordmark={false} />
      </div>
      <h1 className="font-display text-xl font-black tracking-[0.08em] text-ink">AERO-SENSE</h1>
      <p className="text-xs font-medium text-ash">Track · Verify · Protect</p>
      <p className="text-[11px] text-ash">Aircraft Component Intelligence</p>
      <div className="!mt-4 h-px w-full bg-pebble" />
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-ink text-ink">
      <div className="hidden min-h-screen items-center justify-center overflow-hidden relative lg:flex">
        <div className="relative shrink-0" style={{ aspectRatio: '1616 / 973', width: 'max(100vw, calc(100vh * 1616 / 973))', height: 'max(100vh, calc(100vw * 973 / 1616))' }}>
          <img src={showcaseImage} alt="AERO-SENSE — Aircraft Component Intelligence" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute flex flex-col justify-center gap-6 px-8" style={{ left: '59.16%', top: '3%', width: '37.5%', height: '88.7%' }}>
            {brand}
            <div className="overflow-y-auto">{form}</div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] p-6 lg:hidden">
        <div className="w-full max-w-md space-y-6">
          {brand}
          <Card className="p-8">{form}</Card>
        </div>
      </div>
    </div>
  );
};
