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
  leadingIcon?: boolean;
  mono?: boolean;
  translucent?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id, value, onChange, placeholder, required, minLength,
  autoComplete = 'new-password', leadingIcon = false, mono = false, translucent = false,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {leadingIcon && <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" />}
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-slate-200 bg-white py-3.5 ${leadingIcon ? 'pl-11' : 'pl-4'} pr-12 text-[15px] font-medium text-slate-900 caret-indigo-600 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${mono ? 'aero-mono' : ''} ${translucent ? 'bg-white/90' : ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};
