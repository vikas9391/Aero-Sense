import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  /** Shows a leading lock icon (used on the login form). */
  leadingIcon?: boolean;
  /** Monospace text, matching the "generated password" style fields use. */
  mono?: boolean;
  /** Slightly translucent background, matching the login card. */
  translucent?: boolean;
}

/**
 * A password field with a show/hide toggle. Visual styling intentionally
 * mirrors the plain <input type="password"> fields used across the app so it
 * drops in as a straight replacement.
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete = 'new-password',
  leadingIcon = false,
  mono = false,
  translucent = false,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {leadingIcon && <Lock className="absolute left-3.5 top-3 h-5 w-5 text-slate-500 pointer-events-none" />}
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 ${translucent ? 'bg-white/90' : 'bg-white'} py-2.5 ${
          leadingIcon ? 'pl-11' : 'pl-4'
        } pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          mono ? 'font-mono' : ''
        }`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-2.5 text-slate-400 transition hover:text-slate-600"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};
