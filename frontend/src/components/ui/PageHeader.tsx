import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
}

/** Consistent, responsive command-header used across authenticated screens. */
export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, action }) => (
  <header className="relative overflow-hidden rounded-2xl border border-pebble bg-white/90 px-5 py-5 shadow-[0_18px_50px_-32px_rgba(7,18,24,.28)] sm:px-6 sm:py-6">
    <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(23,105,255,.11),transparent_68%)]" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="aero-eyebrow mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(23,105,255,.10)]" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
      </div>
      {action && <div className="relative shrink-0">{action}</div>}
    </div>
  </header>
);

export default PageHeader;
