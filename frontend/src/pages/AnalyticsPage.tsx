import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';
import { WorkAnalytics } from '../types';
import { BarChart3, Users, Plane, Cpu, Wrench, ScanLine, CheckCircle2, XCircle } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="glass-card rounded-2xl border border-slate-200 p-5 flex items-center space-x-4">
    <div className="rounded-xl bg-indigo-600/10 p-3 border border-indigo-500/20">
      <Icon className="h-5 w-5 text-indigo-600" />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<WorkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    analyticsApi
      .getOverview()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error?.message ?? null))
      .finally(() => setLoading(false));
  }, [retryCount]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading work analytics…</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card flex animate-pulse items-center space-x-4 rounded-2xl border border-slate-200 p-5">
            <div className="h-11 w-11 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-10 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
          <XCircle className="h-7 w-7" />
        </div>
        <div>
          <div className="font-bold text-slate-900">Analytics Unavailable</div>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            We couldn't reach the analytics service. Please try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card mx-auto max-w-md space-y-3 rounded-2xl border border-slate-200 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
          <BarChart3 className="h-7 w-7" />
        </div>
        <div className="font-bold uppercase tracking-wide text-slate-700">No Activity Yet</div>
        <p className="mx-auto max-w-xs text-sm text-slate-500">
          Analytics will appear here once aircraft, components, and maintenance records start coming in.
        </p>
      </div>
    );
  }

  const maxUserCount = Math.max(1, ...data.records_by_user.map((u) => u.maintenance_count));

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <BarChart3 className="h-7 w-7 text-indigo-600" />
          <span>Work Analytics</span>
        </h1>
        
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Team Members" value={data.total_users} />
        <StatCard icon={Plane} label="Aircraft" value={data.total_aircraft} />
        <StatCard icon={Cpu} label="Components" value={data.total_components} />
        <StatCard icon={Wrench} label="Maintenance Records" value={data.total_maintenance_records} />
        <StatCard icon={ScanLine} label="Verification Scans" value={data.total_verifications} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification pass/fail */}
        <div className="glass-card rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Verification Outcomes</h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-slate-700">{data.verifications_passed} authentic</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span className="text-sm text-slate-700">{data.verifications_failed} flagged</span>
            </div>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500"
              style={{
                width: `${
                  data.total_verifications > 0
                    ? (data.verifications_passed / data.total_verifications) * 100
                    : 0
                }%`,
              }}
            />
            <div
              className="h-full bg-rose-500"
              style={{
                width: `${
                  data.total_verifications > 0
                    ? (data.verifications_failed / data.total_verifications) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 pt-2">
            Maintenance Results
          </h3>
          <div className="space-y-2">
            {data.maintenance_by_result.length === 0 && (
              <div className="text-xs text-slate-500">No maintenance records yet.</div>
            )}
            {data.maintenance_by_result.map((r) => (
              <div key={r.inspection_result} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{r.inspection_result}</span>
                <span className="font-mono text-slate-800">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Work by user */}
        <div className="glass-card rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Maintenance Activity by Team Member</h2>
          <div className="space-y-3">
            {data.records_by_user.length === 0 && (
              <div className="text-xs text-slate-500">No team activity yet.</div>
            )}
            {data.records_by_user.map((u) => (
              <div key={u.user_id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{u.user_name}</span>
                  <span className="font-mono text-slate-500">{u.maintenance_count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${(u.maintenance_count / maxUserCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
