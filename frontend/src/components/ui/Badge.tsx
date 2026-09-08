import React from 'react';
import clsx from 'clsx';

export type BadgeTone = 'verified' | 'warning' | 'critical' | 'info' | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  verified: 'text-good bg-[#e8f5f0] border-[#c9e8d7]',
  warning: 'text-warning bg-[#fbf1de] border-[#f0dcae]',
  critical: 'text-critical bg-[#fbeceb] border-[#f0cbc7]',
  info: 'text-info bg-[#eaf1f8] border-[#c9dcec]',
  neutral: 'text-ash bg-[#f8f6f2] border-pebble',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className, mono }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-[0_1px_2px_rgba(36,35,33,.04)]',
      TONE_CLASSES[tone],
      mono && 'aero-mono normal-case tracking-normal',
      className
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {children}
  </span>
);

export default Badge;
