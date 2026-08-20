import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tight?: boolean;
}

/** Flat hairline surface — the app-shell equivalent of the landing page's .hairline cards. */
export const Card: React.FC<CardProps> = ({ tight, className, children, ...rest }) => (
  <div className={clsx(tight ? 'aero-panel-tight' : 'aero-panel', className)} {...rest}>
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, action, className }) => (
  <div className={clsx('mb-4 flex items-center justify-between', className)}>
    <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
      {Icon && <Icon className="h-4 w-4 text-ash" />}
      <span>{title}</span>
    </h2>
    {action}
  </div>
);

export default Card;
