import React from 'react';
import clsx from 'clsx';
import { BadgeTone } from './Badge';

const TONE_TEXT: Record<BadgeTone, string> = {
  verified: 'text-[#0a7a4c]',
  warning: 'text-[#b5790f]',
  critical: 'text-[#b13a2f]',
  info: 'text-[#2a5d8f]',
  neutral: 'text-ink',
};

const TONE_ICON_BG: Record<BadgeTone, string> = {
  verified: 'bg-[#e9f6ef] border-[#c9e8d7] text-[#0a7a4c]',
  warning: 'bg-[#fbf1de] border-[#f0dcae] text-[#b5790f]',
  critical: 'bg-[#fbeceb] border-[#f0cbc7] text-[#b13a2f]',
  info: 'bg-[#eaf1f8] border-[#c9dcec] text-[#2a5d8f]',
  neutral: 'bg-[#f1f1ef] border-pebble text-ink',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: BadgeTone;
}

/** Single metric tile — used across Dashboard/Analytics/Security. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, helper, icon: Icon, tone = 'neutral' }) => (
  <div className="aero-panel p-5">
    <div className="flex items-center justify-between">
      <span className="aero-eyebrow">{label}</span>
      <div className={clsx('flex h-9 w-9 items-center justify-center rounded-lg border', TONE_ICON_BG[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className={clsx('mt-4 text-3xl font-semibold tracking-tight', TONE_TEXT[tone])}>{value}</div>
    {helper && <div className="mt-2 text-xs text-ash">{helper}</div>}
  </div>
);

export default StatCard;
