import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import showcaseImage from '../assets/aero-sense-showcase.png';

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

  // The login form. Positioned inside the white card that's baked into the
  // showcase image, alongside the brand mark (shared with the mobile
  // fallback further down).
  const form = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center space-x-3 rounded-xl bg-rose-50/80 p-4 text-sm text-rose-600 border border-rose-200/60">
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
  );

  // Brand mark shown at the top of the white card (desktop) and above the
  // form on mobile.
  const brand = (
    <div className="text-center space-y-2">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/25">
        <ShieldCheck className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-xl font-extrabold tracking-tight text-slate-900">AERO-SENSE</h1>
      <p className="text-xs text-slate-500">Aircraft Component Intelligence</p>
      <div className="!mt-4 h-px w-full bg-slate-200" />
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0b1023] text-slate-900">
      {/* ---- Desktop / tablet-landscape: full-bleed showcase image, form
           dropped into the white card baked into the artwork. The frame
           keeps the image's own 1616:973 aspect ratio but is scaled up to
           cover the entire viewport (like object-fit: cover), with the
           overflow clipped by the outer wrapper. Because the white-card
           overlay is positioned as a percentage of that same frame — not
           of the viewport — it gets clipped in lockstep with the image, so
           it always lines up with the card no matter the screen size. ---- */}
      <div className="hidden lg:flex min-h-screen items-center justify-center overflow-hidden relative">
        <div
          className="relative shrink-0"
          style={{
            aspectRatio: '1616 / 973',
            width: 'max(100vw, calc(100vh * 1616 / 973))',
            height: 'max(100vh, calc(100vw * 973 / 1616))',
          }}
        >
          <img
            src={showcaseImage}
            alt="AERO-SENSE — Aircraft Component Intelligence"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Nudged up slightly within the card (top reduced, height held
              roughly steady) so the field stack sits a little higher and
              isn't as tight against the card's bottom edge. */}
          <div
            className="absolute flex flex-col justify-center gap-6 px-8"
            style={{
              left: '59.16%',
              top: '3%',
              width: '37.5%',
              height: '88.7%',
            }}
          >
            {brand}
            <div className="overflow-y-auto">{form}</div>
          </div>
        </div>
      </div>

      {/* ---- Mobile / narrow viewports: the wide showcase image doesn't
           crop sensibly into a portrait frame, so fall back to a plain
           white card with the same branding instead. ---- */}
      <div className="lg:hidden flex min-h-screen items-center justify-center p-6 bg-[#dde4ee]">
        <div className="w-full max-w-md space-y-6">
          {brand}
          <div className="glass-card rounded-2xl p-8 shadow-2xl border border-slate-200/80 bg-white">
            {form}
          </div>
        </div>
      </div>
    </div>
  );
};