import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let idCounter = 0;

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ElementType; classes: string; iconClasses: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-white border-emerald-200 text-slate-900',
    iconClasses: 'text-emerald-600',
  },
  error: {
    icon: XCircle,
    classes: 'bg-white border-rose-200 text-slate-900',
    iconClasses: 'text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-white border-amber-200 text-slate-900',
    iconClasses: 'text-amber-600',
  },
  info: {
    icon: Info,
    classes: 'bg-white border-indigo-200 text-slate-900',
    iconClasses: 'text-indigo-600',
  },
};

const AUTO_DISMISS_MS = 5000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  // Also listen for the global 'aero-sense:toast' event so non-React code
  // (like the axios response interceptor in services/api.ts, which sits
  // outside the React tree) can surface a toast without needing a hook.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; variant?: ToastVariant }>).detail;
      if (detail?.message) {
        showToast(detail.message, detail.variant ?? 'info');
      }
    };
    window.addEventListener('aero-sense:toast', handler);
    return () => window.removeEventListener('aero-sense:toast', handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { icon: Icon, classes, iconClasses } = VARIANT_STYLES[toast.variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border shadow-lg shadow-slate-900/5 px-4 py-3 animate-in fade-in slide-in-from-top-2 ${classes}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconClasses}`} />
      <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Fire a toast from outside the React tree (e.g. axios interceptors).
 * Safe to call even before ToastProvider has mounted its listener — the
 * event will simply be missed in that edge case rather than throwing.
 */
export const emitToast = (message: string, variant: ToastVariant = 'info') => {
  window.dispatchEvent(new CustomEvent('aero-sense:toast', { detail: { message, variant } }));
};
