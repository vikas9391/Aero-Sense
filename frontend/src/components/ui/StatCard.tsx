import React from 'react';
import clsx from 'clsx';
import { BadgeTone } from './Badge';

const TONE_TEXT: Record<BadgeTone, string> = {
  verified: 'text-good',
  warning: 'text-warning',
  critical: 'text-critical',
  info: 'text-info',
  neutral: 'text-ink',
};

const TONE_ICON_BG: Record<BadgeTone, string> = {
  verified: 'bg-[#e8f5f0] border-[#c9e8d7] text-good',
  warning: 'bg-[#fbf1de] border-[#f0dcae] text-warning',
  critical: 'bg-[#fbeceb] border-[#f0cbc7] text-critical',
  info: 'bg-[#eaf1f8] border-[#c9dcec] text-info',
  neutral: 'bg-[#f8f6f2] border-pebble text-ink',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: BadgeTone;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, helper, icon: Icon, tone = 'neutral' }) => (
  <div className="aero-panel min-w-0 p-5">
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="aero-eyebrow min-w-0 truncate">{label}</span>
      <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', TONE_ICON_BG[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className={clsx('mt-4 truncate text-3xl font-semibold tracking-tight', TONE_TEXT[tone])}>{value}</div>
    {helper && <div className="mt-2 truncate text-xs text-ash">{helper}</div>}
  </div>
);

export default StatCard;
