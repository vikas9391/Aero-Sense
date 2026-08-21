import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';
import { WorkAnalytics } from '../types';
import { BarChart3, Users, Plane, Cpu, Wrench, ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

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
          <div key={i} className="aero-panel flex animate-pulse items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-[#f1f1ef]" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-10 rounded bg-[#f1f1ef]" />
              <div className="h-3 w-20 rounded bg-[#f1f1ef]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md space-y-4 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f0cbc7] bg-[#fbeceb] text-[#b13a2f]">
          <XCircle className="h-7 w-7" />
        </div>
        <div>
          <div className="font-semibold text-ink">Analytics Unavailable</div>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ash">
            We couldn't reach the analytics service. Please try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="pill-btn pill-btn-primary text-sm"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="mx-auto max-w-md space-y-3 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-pebble bg-[#f7f7f5] text-ash">
          <BarChart3 className="h-7 w-7" />
        </div>
        <div className="aero-eyebrow">No Activity Yet</div>
        <p className="mx-auto max-w-xs text-sm text-ash">
          Analytics will appear here once aircraft, components, and maintenance records start coming in.
        </p>
      </Card>
    );
  }

  const maxUserCount = Math.max(1, ...data.records_by_user.map((u) => u.maintenance_count));

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Fleet Insights" title="Work Analytics" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Team Members" value={data.total_users} tone="info" />
        <StatCard icon={Plane} label="Aircraft" value={data.total_aircraft} tone="info" />
        <StatCard icon={Cpu} label="Components" value={data.total_components} tone="info" />
        <StatCard icon={Wrench} label="Maintenance Records" value={data.total_maintenance_records} tone="info" />
        <StatCard icon={ScanLine} label="Verification Scans" value={data.total_verifications} tone="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification pass/fail */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Verification Outcomes</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#0a7a4c]" />
              <span className="text-sm text-ink">{data.verifications_passed} authentic</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-[#b13a2f]" />
              <span className="text-sm text-ink">{data.verifications_failed} flagged</span>
            </div>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#f1f1ef] overflow-hidden flex">
            <div
              className="h-full bg-[#0a7a4c]"
              style={{
                width: `${
                  data.total_verifications > 0
                    ? (data.verifications_passed / data.total_verifications) * 100
                    : 0
                }%`,
              }}
            />
            <div
              className="h-full bg-[#b13a2f]"
              style={{
                width: `${
                  data.total_verifications > 0
                    ? (data.verifications_failed / data.total_verifications) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <h3 className="aero-eyebrow text-[10px] pt-2">Maintenance Results</h3>
          <div className="space-y-2">
            {data.maintenance_by_result.length === 0 && (
              <div className="text-xs text-ash">No maintenance records yet.</div>
            )}
            {data.maintenance_by_result.map((r) => (
              <div key={r.inspection_result} className="flex items-center justify-between text-xs">
                <span className="text-ash">{r.inspection_result}</span>
                <span className="aero-mono text-ink">{r.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Work by user */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Maintenance Activity by Team Member</h2>
          <div className="space-y-3">
            {data.records_by_user.length === 0 && (
              <div className="text-xs text-ash">No team activity yet.</div>
            )}
            {data.records_by_user.map((u) => (
              <div key={u.user_id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink">{u.user_name}</span>
                  <span className="aero-mono text-ash">{u.maintenance_count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#f1f1ef] overflow-hidden">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${(u.maintenance_count / maxUserCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
