import React, { useEffect, useMemo, useState } from 'react';
import { verificationApi } from '../services/api';
import { VerificationLog } from '../types';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, XCircle, Radio, Lock, Fingerprint, Database, Clock3 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';

export const SecurityPage: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    verificationApi.listLogs()
      .then(setLogs)
      .catch((err) => {
        console.error(err);
        showToast('Couldn\'t load the security audit log.', 'error');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: logs.length,
    authentic: logs.filter((l) => l.final_result === 'AUTHENTIC').length,
    suspicious: logs.filter((l) => l.final_result === 'SUSPICIOUS').length,
    failed: logs.filter((l) => l.final_result !== 'AUTHENTIC' && l.final_result !== 'SUSPICIOUS').length,
  }), [logs]);

  return (
    <div className="min-w-0 space-y-7 pb-8">
      <PageHeader
        eyebrow="Security Operations / Audit"
        title="Security Command Center"
        action={
          <div className="flex items-center gap-2 rounded-xl border border-[#bfe5d5] bg-[#effaf5] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#087a58]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0b9b83]" /> Monitoring active
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-[28px] bg-[#071218] p-6 text-white shadow-[0_28px_70px_-40px_rgba(7,18,24,.75)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(23,105,255,.25),transparent_30%),radial-gradient(circle_at_15%_100%,rgba(11,155,131,.12),transparent_32%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-sky-300"><ShieldAlert className="h-3.5 w-3.5" /> Integrity monitoring</div>
            <h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">Every verification event becomes part of the security trail.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review NFC authentication, component binding, physical tamper signals and proof integrity from a single operational view.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['TOTAL', stats.total, Activity],
              ['AUTHENTIC', stats.authentic, CheckCircle2],
              ['SUSPICIOUS', stats.suspicious, AlertTriangle],
              ['FAILED', stats.failed, XCircle],
            ].map(([label, value, Icon]) => {
              const I = Icon as React.ComponentType<{ className?: string }>;
              return <div key={String(label)} className="min-w-[88px] rounded-2xl border border-white/10 bg-white/[.06] px-3 py-3"><I className="mb-3 h-4 w-4 text-sky-300" /><div className="font-display text-xl font-semibold">{loading ? '—' : value}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-[.13em] text-slate-400">{label}</div></div>;
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: Radio, title: 'NFC authentication', text: 'Dynamic cryptographic authentication helps prevent cloned or replayed tag identities.' },
          { icon: Fingerprint, title: 'Physical tamper', text: 'TagTamper state changes can surface physical interference with the protected component tag.' },
          { icon: Database, title: 'Proof integrity', text: 'Anchored maintenance digests provide an independent signal when records no longer match.' },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="group p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8ff] bg-[#f6f9ff] text-accent transition group-hover:-translate-y-0.5"><Icon className="h-4 w-4" /></div>
            <h3 className="mt-4 text-sm font-bold text-ink">{title}</h3>
            <p className="mt-1.5 text-xs leading-5 text-ash">{text}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-pebble px-5 py-5 sm:px-6">
          <CardHeader title="Verification event stream" icon={Activity} className="mb-1" />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-ash"><Clock3 className="h-3.5 w-3.5" /> Chronological security events</div>
        </div>
        {loading ? (
          <div className="space-y-3 p-5 sm:p-6">{[1, 2, 3, 4].map((n) => <div key={n} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-app)]" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center sm:p-16"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-pebble bg-accent-soft"><ShieldAlert className="h-6 w-6 text-accent" /></div><h3 className="mt-4 font-display text-lg font-semibold text-ink">No security events yet</h3><p className="mt-1 text-sm text-ash">Verification scans will appear here as the fleet is inspected.</p></div>
        ) : (
          <div className="divide-y divide-pebble">
            {logs.map((log) => {
              const authentic = log.final_result === 'AUTHENTIC';
              const suspicious = log.final_result === 'SUSPICIOUS';
              const Icon = authentic ? CheckCircle2 : suspicious ? AlertTriangle : XCircle;
              const tone = authentic ? 'text-[#087a58] bg-[#effaf5] border-[#bfe5d5]' : suspicious ? 'text-[#ad730d] bg-[#fff9eb] border-[#f0d9a5]' : 'text-[#bd4037] bg-[#fff2f1] border-[#efc8c4]';
              return (
                <div key={log.id} className="group grid gap-4 px-5 py-4 transition hover:bg-[var(--bg-app)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone}`}><Icon className="h-4.5 w-4.5" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-ink">{log.final_result}</span><span className="rounded-full border border-pebble bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ash">Scan #{log.id}</span></div>
                    <div className="mt-1 truncate text-xs text-ash">{log.failure_reason || 'All four verification checks passed successfully.'}</div>
                  </div>
                  <div className="aero-mono text-[10px] text-ash sm:text-right">{log.created_at}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
