import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';
import { WorkAnalytics } from '../types';
import { BarChart3, Users, Plane, Cpu, Wrench, ScanLine, CheckCircle2, XCircle } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="glass-card rounded-2xl border border-slate-800 p-5 flex items-center space-x-4">
    <div className="rounded-xl bg-sky-500/10 p-3 border border-sky-500/20">
      <Icon className="h-5 w-5 text-sky-400" />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<WorkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .getOverview()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Loading work analytics...</div>;
  }

  if (error || !data) {
    return <div className="py-12 text-center text-rose-400 text-sm">{error || 'No data available'}</div>;
  }

  const maxUserCount = Math.max(1, ...data.records_by_user.map((u) => u.maintenance_count));

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <BarChart3 className="h-7 w-7 text-sky-400" />
          <span>Work Analytics</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Company Admin-only: an overview of your company's overall work — this data never
          includes anything from other companies.
        </p>
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
        <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-100">Verification Outcomes</h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-slate-300">{data.verifications_passed} authentic</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-rose-400" />
              <span className="text-sm text-slate-300">{data.verifications_failed} flagged</span>
            </div>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
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

          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2">
            Maintenance Results
          </h3>
          <div className="space-y-2">
            {data.maintenance_by_result.length === 0 && (
              <div className="text-xs text-slate-500">No maintenance records yet.</div>
            )}
            {data.maintenance_by_result.map((r) => (
              <div key={r.inspection_result} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{r.inspection_result}</span>
                <span className="font-mono text-slate-200">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Work by user */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-100">Maintenance Activity by Team Member</h2>
          <div className="space-y-3">
            {data.records_by_user.length === 0 && (
              <div className="text-xs text-slate-500">No team activity yet.</div>
            )}
            {data.records_by_user.map((u) => (
              <div key={u.user_id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{u.user_name}</span>
                  <span className="font-mono text-slate-400">{u.maintenance_count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500"
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
