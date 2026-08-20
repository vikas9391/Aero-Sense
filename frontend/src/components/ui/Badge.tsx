import React from 'react';
import clsx from 'clsx';

export type BadgeTone = 'verified' | 'warning' | 'critical' | 'info' | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  verified: 'text-[#0a7a4c] bg-[#e9f6ef] border-[#c9e8d7]',
  warning: 'text-[#b5790f] bg-[#fbf1de] border-[#f0dcae]',
  critical: 'text-[#b13a2f] bg-[#fbeceb] border-[#f0cbc7]',
  info: 'text-[#2a5d8f] bg-[#eaf1f8] border-[#c9dcec]',
  neutral: 'text-ash bg-[#f1f1ef] border-pebble',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

/** Small pill used for status/result labels (VERIFIED, TAMPERED, PASSED, ...). */
export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className, mono }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
      TONE_CLASSES[tone],
      mono && 'aero-mono normal-case tracking-normal',
      className
    )}
  >
    {children}
  </span>
);

export default Badge;
