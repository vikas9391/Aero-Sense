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
      {leadingIcon && <Lock className="absolute left-3.5 top-3 h-5 w-5 text-ash pointer-events-none" />}
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-pebble ${translucent ? 'bg-white/90' : 'bg-white'} py-2.5 ${
          leadingIcon ? 'pl-11' : 'pl-4'
        } pr-11 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none ${
          mono ? 'aero-mono' : ''
        }`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-2.5 text-ash transition hover:text-ink"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};
