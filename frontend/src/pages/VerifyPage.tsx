import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verificationApi } from '../services/api';
import { VerificationResponse } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { ScanLine, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Lock, Radio, Cpu, RefreshCw, Activity, Fingerprint, Database, Waves } from 'lucide-react';

const scenarios = [
  { id: 'VALID', label: 'Valid NFC tag', desc: 'All four security layers pass', icon: CheckCircle2 },
  { id: 'UNKNOWN_TAG', label: 'Unknown tag', desc: 'UID is not bound to a component', icon: Fingerprint },
  { id: 'INVALID_TAG', label: 'Invalid signature', desc: 'NFC cryptographic authentication fails', icon: Lock },
  { id: 'TAMPERED_TAG', label: 'Physical tamper', desc: 'TagTamper loop reports interference', icon: AlertTriangle },
  { id: 'BLOCKCHAIN_MISMATCH', label: 'Hash mismatch', desc: 'Blockchain integrity check fails', icon: Database },
];

type ResultTone = 'verified' | 'warning' | 'critical';

const statusTone = (status: VerificationResponse['status']): ResultTone =>
  status === 'AUTHENTIC' ? 'verified' : status === 'SUSPICIOUS' ? 'warning' : 'critical';

const STATUS_ICON: Record<ResultTone, React.ComponentType<{ className?: string }>> = {
  verified: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

const STATUS_TEXT_CLASSES: Record<ResultTone, string> = {
  verified: 'text-[#087a58]',
  warning: 'text-[#ad730d]',
  critical: 'text-[#bd4037]',
};

const STATUS_SURFACE_CLASSES: Record<ResultTone, string> = {
  verified: 'border-[#bfe5d5] bg-[#effaf5]',
  warning: 'border-[#f0d9a5] bg-[#fff9eb]',
  critical: 'border-[#efc8c4] bg-[#fff2f1]',
};

interface CheckRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  passed: boolean;
}

const CheckRow: React.FC<CheckRowProps> = ({ icon: Icon, label, description, passed }) => (
  <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_-24px_rgba(7,18,24,.5)] sm:p-4">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${passed ? 'border-[#c8e8dc] bg-[#f1faf6] text-[#087a58]' : 'border-[#f0cdca] bg-[#fff4f3] text-[#bd4037]'}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-bold text-slate-900 sm:text-sm">{label}</div>
      <div className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-[11px]">{description}</div>
    </div>
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold tracking-[.12em] ${passed ? 'border-[#bfe5d5] bg-[#effaf5] text-[#087a58]' : 'border-[#efc8c4] bg-[#fff2f1] text-[#bd4037]'}`}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  </div>
);

export const VerifyPage: React.FC = () => {
  const [tagIdentifier, setTagIdentifier] = useState('04:A3:91:XX');
  const [scenario, setScenario] = useState('VALID');
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    try {
      const resp = await verificationApi.verifyNfc({
        tag_identifier: tagIdentifier,
        simulate_scenario: scenario,
      });
      setResult(resp);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Verification pipeline execution failed.');
    } finally {
      setVerifying(false);
    }
  };

  const tone = result ? statusTone(result.status) : null;
  const StatusIcon = tone ? STATUS_ICON[tone] : null;

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 pb-8 sm:space-y-8">
      <PageHeader
        eyebrow="Security Operations / Live Verification"
        title="NFC Component Verification"
        action={
          <div className="flex items-center gap-2 rounded-xl border border-[#bfe5d5] bg-[#effaf5] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#087a58]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0b9b83]" />
            Engine Online
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)]">
        <section className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <CardHeader title="NFC Tap Console" icon={Radio} className="mb-0" />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-accent">
                <Waves className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce8ff] bg-[#f6f9ff] p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-sm ring-1 ring-[#dce8ff]">
                  <ScanLine className="h-5 w-5" />
                  <span className="absolute inset-0 rounded-2xl border border-accent/20 animate-ping" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-accent">Reader ready</div>
                  <div className="mt-1 text-xs text-slate-600">Enter a UID or use the mobile NFC reader.</div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="aero-eyebrow text-[10px]">Tag identifier / UID</label>
              <div className="relative">
                <Fingerprint className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tagIdentifier}
                  onChange={(e) => setTagIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-accent/50 focus:ring-4 focus:ring-accent/10 aero-mono"
                  aria-label="NFC tag identifier"
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="aero-eyebrow text-[10px]">Verification test</label>
                <span className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">5 scenarios</span>
              </div>
              <div className="space-y-2">
                {scenarios.map((s) => {
                  const Icon = s.icon;
                  const selected = scenario === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScenario(s.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? 'border-accent/35 bg-[#f1f6ff] shadow-[0_10px_28px_-24px_rgba(23,105,255,.7)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${selected ? 'border-accent/20 bg-white text-accent' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-900">{s.label}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{s.desc}</span>
                      </span>
                      <span className={`h-2 w-2 rounded-full ${selected ? 'bg-accent shadow-[0_0_0_4px_rgba(23,105,255,.10)]' : 'bg-slate-200'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || !tagIdentifier.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1720] px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_35px_-20px_rgba(7,18,24,.8)] transition hover:-translate-y-0.5 hover:bg-[#122532] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              {verifying ? 'Running security pipeline…' : 'Run verification scan'}
            </button>
          </Card>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { value: '01', label: 'NFC Auth' },
              { value: '02', label: 'Binding' },
              { value: '03', label: 'Tamper' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-[0_12px_35px_-30px_rgba(7,18,24,.4)]">
                <div className="text-base font-bold tracking-tight text-slate-900 aero-mono">{item.value}</div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#efc8c4] bg-[#fff2f1] p-4 text-sm text-[#bd4037]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div><div className="font-bold">Verification unavailable</div><div className="mt-0.5 text-xs">{error}</div></div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!result && !error && (
              <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-[#d8e4ea] bg-[#f8fbfd] p-6 sm:p-8">
                  <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(23,105,255,.12),transparent_68%)]" />
                  <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(7,18,24,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(7,18,24,.035)_1px,transparent_1px)] [background-size:34px_34px]" />
                  <div className="relative flex min-h-[500px] flex-col items-center justify-center text-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-[30px] border border-[#cbdde7] bg-white shadow-[0_28px_60px_-38px_rgba(7,18,24,.55)]">
                      <div className="absolute inset-4 rounded-[22px] border border-accent/15" />
                      <ScanLine className="h-10 w-10 text-accent" />
                    </div>
                    <div className="mt-7 text-[10px] font-extrabold uppercase tracking-[.2em] text-accent">Awaiting hardware input</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Ready to verify a component</h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Run a scan to validate the NFC identity, component binding, physical tamper state, and blockchain record integrity.</p>
                    <div className="mt-7 flex flex-wrap justify-center gap-2">
                      {['NFC AUTH', 'IDENTITY', 'TAMPER', 'BLOCKCHAIN'].map((label) => <span key={label} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-extrabold tracking-[.13em] text-slate-500">{label}</span>)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {result && tone && StatusIcon && (
              <motion.div key={`${result.status}-${result.failure_reason ?? ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="space-y-5">
                <div className={`overflow-hidden rounded-[24px] border p-5 sm:p-6 ${STATUS_SURFACE_CLASSES[tone]}`}>
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-white ${tone === 'verified' ? 'border-[#bfe5d5]' : tone === 'warning' ? 'border-[#f0d9a5]' : 'border-[#efc8c4]'}`}>
                        <StatusIcon className={`h-7 w-7 ${STATUS_TEXT_CLASSES[tone]}`} />
                      </div>
                      <div>
                        <div className="text-[9px] font-extrabold uppercase tracking-[.18em] text-slate-500">Verification decision</div>
                        <h2 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${STATUS_TEXT_CLASSES[tone]}`}>{result.status}</h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Activity className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">4-layer security check</span>
                    </div>
                  </div>
                  {result.failure_reason && <div className="mt-5 rounded-2xl border border-white/80 bg-white/75 p-3 text-xs font-medium text-slate-600">{result.failure_reason}</div>}
                </div>

                {result.component && (
                  <Card className="p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <CardHeader title="Matched component passport" icon={Cpu} className="mb-0" />
                      <ShieldCheck className="h-5 w-5 text-accent" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="aero-eyebrow text-[9px]">Component ID</div>
                        <div className="mt-1 text-sm font-bold text-slate-900 aero-mono">{result.component.id}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="aero-eyebrow text-[9px]">Serial number</div>
                        <div className="mt-1 text-sm font-bold text-slate-900 aero-mono">{result.component.serial_number}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="aero-eyebrow text-[9px]">Aircraft</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{result.component.aircraft}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="aero-eyebrow text-[9px]">Tag identity</div>
                        <div className="mt-1 text-sm font-bold text-slate-900 aero-mono">{result.component.tag_identifier}</div>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <CardHeader title="Integrity layers" icon={ShieldCheck} className="mb-0" />
                    <span className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Live result</span>
                  </div>
                  <div className="space-y-3">
                    <CheckRow icon={Lock} label="NFC Authentication" description="Cryptographic tag authentication" passed={result.checks.nfc_authentication} />
                    <CheckRow icon={Cpu} label="Component Binding" description="Tag-to-component ownership match" passed={result.checks.component_binding} />
                    <CheckRow icon={AlertTriangle} label="Tamper Status" description="Physical tamper loop integrity" passed={result.checks.tamper_status} />
                    <CheckRow icon={Database} label="Blockchain Integrity" description="Immutable record hash verification" passed={result.checks.blockchain_integrity} />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};
