import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';

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
      // Role is determined solely by the backend; the Super Admin has no
      // company and no access to operational dashboards, so it lands on
      // company management instead.
      navigate(user.role === 'SUPER_ADMIN' ? '/companies' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-md space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-xl shadow-indigo-500/25">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">AIR-VERIFY PLATFORM</h1>
          <p className="text-sm text-slate-500">
            Secure Aircraft Component Verification & Digital Maintenance System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-4 text-sm text-rose-600 border border-rose-200/60">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  autoComplete="organization"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Platform administrators sign in with company name "Super Admin".
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                leadingIcon
                translucent
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to Platform'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
