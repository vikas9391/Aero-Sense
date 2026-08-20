import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
}

/** Consistent page-level header used across every internal app screen. */
export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, action }) => (
  <div className="flex flex-col gap-4 border-b border-pebble pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      {eyebrow && <div className="aero-eyebrow mb-1">{eyebrow}</div>}
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
    </div>
    {action}
  </div>
);

export default PageHeader;
