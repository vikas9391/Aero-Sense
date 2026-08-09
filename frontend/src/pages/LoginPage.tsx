import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
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
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-xl shadow-sky-500/25">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">AIR-VERIFY PLATFORM</h1>
          <p className="text-sm text-slate-400">
            Secure Aircraft Component Verification & Digital Maintenance System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-slate-800/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-3 rounded-xl bg-rose-950/50 p-4 text-sm text-rose-300 border border-rose-800/60">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="technician@aircraft.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to Platform'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
              Demo Accounts (Role Determined by Backend)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@gmail.com')}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-left hover:bg-slate-800/80 transition"
              >
                <div className="font-semibold text-fuchsia-400">Super Admin</div>
                <div className="text-[10px] text-slate-400">SUPER_ADMIN_EMAIL in .env</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@aircraft.com')}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-left hover:bg-slate-800/80 transition"
              >
                <div className="font-semibold text-sky-400">Company Admin</div>
                <div className="text-[10px] text-slate-400">admin@aircraft.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('manufacturer@aircraft.com')}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-left hover:bg-slate-800/80 transition"
              >
                <div className="font-semibold text-indigo-400">Manufacturer</div>
                <div className="text-[10px] text-slate-400">manufacturer@aircraft.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('technician@aircraft.com')}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-left hover:bg-slate-800/80 transition"
              >
                <div className="font-semibold text-emerald-400">Lead Technician</div>
                <div className="text-[10px] text-slate-400">technician@aircraft.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('inspector@aircraft.com')}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-left hover:bg-slate-800/80 transition"
              >
                <div className="font-semibold text-amber-400">Safety Inspector</div>
                <div className="text-[10px] text-slate-400">inspector@aircraft.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Disclaimer */}
        <p className="text-center text-xs text-slate-500">
          AES-128 Cryptographic SUN & TagTamper Protected • Off-Chain SHA-256 Digest Anchored
        </p>
      </div>
    </div>
  );
};
