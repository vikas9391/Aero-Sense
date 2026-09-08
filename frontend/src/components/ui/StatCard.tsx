import React from 'react';
import clsx from 'clsx';
import { BadgeTone } from './Badge';

const TONE_TEXT: Record<BadgeTone, string> = { verified: 'text-good', warning: 'text-warning', critical: 'text-critical', info: 'text-info', neutral: 'text-ink' };
const TONE_ICON_BG: Record<BadgeTone, string> = {
  verified: 'bg-good/8 border-good/15 text-good',
  warning: 'bg-warning/8 border-warning/15 text-warning',
  critical: 'bg-critical/8 border-critical/15 text-critical',
  info: 'bg-accent-soft border-accent/15 text-accent',
  neutral: 'bg-slate-100 border-pebble text-ink',
};
interface StatCardProps { label: string; value: React.ReactNode; helper?: string; icon: React.ComponentType<{ className?: string }>; tone?: BadgeTone; }
export const StatCard: React.FC<StatCardProps> = ({ label, value, helper, icon: Icon, tone = 'neutral' }) => (
  <div className="aero-panel group relative min-w-0 overflow-hidden p-5 transition duration-300 hover:-translate-y-1">
    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/5 blur-2xl transition group-hover:bg-accent/10" />
    <div className="relative flex min-w-0 items-center justify-between gap-3">
      <span className="aero-eyebrow min-w-0 truncate">{label}</span>
      <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border', TONE_ICON_BG[tone])}><Icon className="h-4 w-4" /></div>
    </div>
    <div className={clsx('relative mt-5 truncate font-display text-4xl font-semibold tracking-[-.04em]', TONE_TEXT[tone])}>{value}</div>
    {helper && <div className="relative mt-2 truncate text-[11px] leading-5 text-ash">{helper}</div>}
  </div>
);
export default StatCard;
