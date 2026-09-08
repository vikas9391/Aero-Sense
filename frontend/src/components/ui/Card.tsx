import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tight?: boolean;
}

/** Premium application surface with subtle aerospace depth and interaction feedback. */
export const Card: React.FC<CardProps> = ({ tight, className, children, ...rest }) => (
  <div
    className={clsx(
      tight ? 'aero-panel-tight' : 'aero-panel',
      'relative overflow-hidden transition-[transform,box-shadow,border-color] duration-300',
      'hover:border-[#cbd8df] hover:shadow-[0_22px_55px_-34px_rgba(7,18,24,.38)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, action, className }) => (
  <div className={clsx('mb-4 flex items-center justify-between gap-4', className)}>
    <h2 className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-ink">
      {Icon && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-pebble bg-[var(--bg-app)]">
          <Icon className="h-3.5 w-3.5 text-accent" />
        </span>
      )}
      <span className="truncate">{title}</span>
    </h2>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default Card;
