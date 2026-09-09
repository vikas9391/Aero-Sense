import React, { useEffect, useMemo, useState } from 'react';
import { componentsApi, maintenanceApi, verificationApi } from '../services/api';
import { Component, MaintenanceRecord } from '../types';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge, BadgeTone } from '../components/ui/Badge';
import { AlertCircle, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, History, Lock, RefreshCw, Search, ShieldAlert, Wrench, X } from 'lucide-react';

const RESULT_TONE: Record<'PASSED' | 'FAILED' | 'WARNING', BadgeTone> = {
  PASSED: 'verified', WARNING: 'warning', FAILED: 'critical',
};

export const MaintenancePage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [componentId, setComponentId] = useState<number | ''>('');
  const [maintenanceType, setMaintenanceType] = useState('INSPECTION');
  const [description, setDescription] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [inspectionResult, setInspectionResult] = useState<'PASSED' | 'FAILED' | 'WARNING'>('PASSED');
  const [submitting, setSubmitting] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<MaintenanceRecord | null>(null);
  const [blockchainVerified, setBlockchainVerified] = useState<boolean | null>(null);
  const [verifyingHash, setVerifyingHash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [historyQuery, setHistoryQuery] = useState('');

  const loadRecords = () => {
    setRecordsLoading(true);
    setRecordsError(null);
    maintenanceApi.listAll().then(setRecords).catch((err) => {
      console.error(err); setRecordsError('Failed to load maintenance history.');
    }).finally(() => setRecordsLoading(false));
  };

  useEffect(() => {
    componentsApi.list().then(setComponents).catch((err) => {
      console.error(err); showToast("Couldn't load the component list for this form.", 'error');
    });
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedComponent = useMemo(() => components.find((c) => c.id === Number(componentId)), [components, componentId]);
  const filteredRecords = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => `${r.id} ${r.component_id} ${r.maintenance_type} ${r.inspection_result} ${r.description} ${r.technician_name} ${r.parts_replaced || ''}`.toLowerCase().includes(q));
  }, [records, historyQuery]);
  const passedCount = records.filter((r) => r.inspection_result === 'PASSED').length;
  const warningCount = records.filter((r) => r.inspection_result === 'WARNING').length;
  const failedCount = records.filter((r) => r.inspection_result === 'FAILED').length;

  const resetForm = () => {
    setComponentId(''); setMaintenanceType('INSPECTION'); setDescription(''); setPartsReplaced(''); setInspectionResult('PASSED');
    setCreatedRecord(null); setBlockchainVerified(null); setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentId) { setError('Please select a component.'); return; }
    if (description.trim().length < 5) { setError('Please provide a little more detail about the work performed.'); return; }
    setError(null); setCreatedRecord(null); setBlockchainVerified(null); setSubmitting(true);
    try {
      const rec = await maintenanceApi.create({
        component_id: Number(componentId), maintenance_type: maintenanceType, description: description.trim(),
        parts_replaced: partsReplaced.trim() || undefined, inspection_result: inspectionResult,
      });
      setCreatedRecord(rec); setDescription(''); setPartsReplaced(''); loadRecords();
      showToast('Maintenance record securely anchored.', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit maintenance log.');
    } finally { setSubmitting(false); }
  };

  const verifyBlockchainHash = async () => {
    if (!createdRecord) return;
    setVerifyingHash(true);
    try {
      const res = await verificationApi.verifyBlockchain(createdRecord.id);
      setBlockchainVerified(res.verified);
      showToast(res.verified ? 'Blockchain proof confirmed.' : 'Hash mismatch detected.', res.verified ? 'success' : 'error');
    } catch (err) {
      console.error('Blockchain proof verification failed:', err);
      showToast('Blockchain proof verification failed. Please try again.', 'error');
    } finally { setVerifyingHash(false); }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <PageHeader eyebrow="Maintenance Control / Technician Portal" title="Maintenance Operations" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Records', value: records.length, icon: History, note: 'Logged maintenance' },
          { label: 'Passed', value: passedCount, icon: CheckCircle2, note: 'Airworthy results' },
          { label: 'Monitor', value: warningCount, icon: Clock3, note: 'Needs attention' },
          { label: 'Failed', value: failedCount, icon: ShieldAlert, note: 'Unserviceable' },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-2xl border border-pebble bg-white p-4 shadow-[0_8px_30px_-24px_rgba(7,18,24,.35)]">
            <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-ash">{item.label}</span><Icon className="h-4 w-4 text-accent" /></div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-ink">{item.value}</div><div className="mt-1 text-[10px] text-ash">{item.note}</div>
          </div>;
        })}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-pebble bg-[linear-gradient(135deg,#071218,#102b3a)] px-6 py-6 text-white sm:px-8">
            <div className="flex items-start justify-between gap-4"><div><div className="aero-eyebrow text-[10px] text-cyan-200">Work Order Entry</div><h2 className="mt-2 text-xl font-bold tracking-tight">Log a maintenance event</h2><p className="mt-1 text-xs leading-5 text-slate-300">Create a traceable service record and generate its cryptographic proof.</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Wrench className="h-5 w-5 text-cyan-200" /></div></div>
          </div>
          <div className="p-6 sm:p-8">
            {error && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{error}</span><button type="button" onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2"><label className="aero-eyebrow text-[10px]">Target Component</label><select required value={componentId} onChange={(e) => { setComponentId(e.target.value === '' ? '' : Number(e.target.value)); setError(null); }} className="w-full rounded-2xl border border-pebble bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"><option value="">Select a component...</option>{components.map((c) => <option key={c.id} value={c.id}>{c.component_uuid} — {c.component_type} · SN {c.serial_number}</option>)}</select></div>
              {selectedComponent && <div className="grid grid-cols-2 gap-3 rounded-2xl border border-accent/10 bg-accent-soft/50 p-4 sm:grid-cols-3"><div><div className="aero-eyebrow text-[9px]">Component</div><div className="mt-1 truncate text-xs font-bold text-ink">{selectedComponent.component_uuid}</div></div><div><div className="aero-eyebrow text-[9px]">Type</div><div className="mt-1 truncate text-xs font-semibold text-ink">{selectedComponent.component_type}</div></div><div className="col-span-2 sm:col-span-1"><div className="aero-eyebrow text-[9px]">Serial</div><div className="mt-1 truncate text-xs font-semibold text-ink">{selectedComponent.serial_number}</div></div></div>}
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><label className="aero-eyebrow text-[10px]">Maintenance Type</label><select value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)} className="w-full rounded-2xl border border-pebble bg-white px-4 py-3 text-sm font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"><option value="INSPECTION">Routine Line Inspection</option><option value="REPAIR">Component Repair</option><option value="OVERHAUL">Major Depot Overhaul</option><option value="REPLACEMENT">Component Replacement</option></select></div><div className="space-y-2"><label className="aero-eyebrow text-[10px]">Inspection Result</label><select value={inspectionResult} onChange={(e) => setInspectionResult(e.target.value as 'PASSED' | 'FAILED' | 'WARNING')} className="w-full rounded-2xl border border-pebble bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"><option value="PASSED">PASSED — Airworthy</option><option value="WARNING">WARNING — Monitor</option><option value="FAILED">FAILED — Unserviceable</option></select></div></div>
              <div className="space-y-2"><div className="flex items-center justify-between"><label className="aero-eyebrow text-[10px]">Work Performed</label><span className="text-[10px] text-ash">Detailed service note</span></div><textarea required rows={5} placeholder="Describe work completed, measurements, inspections and test results..." value={description} onChange={(e) => { setDescription(e.target.value); setError(null); }} className="w-full resize-y rounded-2xl border border-pebble bg-white p-4 text-sm leading-6 text-ink outline-none placeholder:text-ash focus:border-accent focus:ring-4 focus:ring-accent/10" /></div>
              <div className="space-y-2"><label className="aero-eyebrow text-[10px]">Parts Replaced <span className="normal-case tracking-normal text-ash">(optional)</span></label><input value={partsReplaced} onChange={(e) => setPartsReplaced(e.target.value)} placeholder="Part name / part number" className="w-full rounded-2xl border border-pebble bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ash focus:border-accent focus:ring-4 focus:ring-accent/10" /></div>
              <div className="flex flex-col-reverse gap-3 border-t border-pebble pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={resetForm} className="rounded-xl px-4 py-2.5 text-xs font-bold text-ash transition hover:bg-slate-50 hover:text-ink">Clear form</button><button type="submit" disabled={submitting} className="pill-btn pill-btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:cursor-wait disabled:opacity-50">{submitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Anchoring record...</> : <><ClipboardCheck className="h-4 w-4" /> Submit & Compute Hash</>}</button></div>
            </form>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6"><CardHeader title="Integrity Proof" icon={FileCheck2} /><div className="mt-5 rounded-2xl border border-dashed border-pebble bg-slate-50/70 p-6 text-center"><Lock className="mx-auto h-6 w-6 text-accent" /><div className="mt-3 text-sm font-bold text-ink">Cryptographic anchoring</div><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-ash">Every submitted record receives a SHA-256 digest that can be compared with its blockchain anchor.</p></div></Card>
          {createdRecord && <Card className="border-accent/15 bg-accent-soft/30 p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-bold text-good"><CheckCircle2 className="h-4 w-4" /> Record anchored</div><div className="mt-1 text-[10px] text-ash">Maintenance record #{createdRecord.id}</div></div><Badge tone="verified">SECURED</Badge></div><div className="mt-5 rounded-2xl border border-pebble bg-white p-4"><div className="aero-eyebrow text-[9px]">SHA-256 Record Digest</div><div className="aero-mono mt-2 break-all text-[11px] font-semibold leading-5 text-ink">{createdRecord.record_hash}</div></div><button type="button" onClick={verifyBlockchainHash} disabled={verifyingHash} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-pebble bg-white px-4 py-3 text-xs font-bold text-ink transition hover:border-accent/30 hover:text-accent disabled:opacity-50">{verifyingHash ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}{verifyingHash ? 'Comparing anchors...' : 'Verify blockchain anchor'}</button>{blockchainVerified !== null && <div className="mt-3 flex justify-center"><Badge tone={blockchainVerified ? 'verified' : 'critical'} className="gap-1.5">{blockchainVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}{blockchainVerified ? 'Hashes match — record intact' : 'Hash mismatch detected'}</Badge></div>}</Card>}
        </div>
      </div>

      <Card className="p-6 sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><CardHeader title="Maintenance History" icon={History} /><div className="flex w-full gap-2 lg:w-auto"><div className="relative min-w-0 flex-1 lg:w-80"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" /><input value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} placeholder="Search records..." className="w-full rounded-xl border border-pebble bg-white py-2.5 pl-10 pr-3 text-xs text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></div><button type="button" onClick={loadRecords} disabled={recordsLoading} className="inline-flex items-center gap-2 rounded-xl border border-pebble bg-white px-3 py-2.5 text-xs font-bold text-ink hover:border-accent/30 hover:text-accent disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${recordsLoading ? 'animate-spin' : ''}`} /> Refresh</button></div></div>
        {recordsError && <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{recordsError}</div>}
        {recordsLoading ? <div className="py-12 text-center text-xs text-ash">Loading maintenance history...</div> : filteredRecords.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-pebble p-10 text-center"><History className="mx-auto h-6 w-6 text-slate-300" /><div className="mt-3 text-sm font-semibold text-ink">{historyQuery ? 'No matching records' : 'No maintenance records yet'}</div><div className="mt-1 text-xs text-ash">{historyQuery ? 'Try another search term.' : 'Submitted service events will appear here.'}</div></div> : <div className="mt-5 overflow-hidden rounded-2xl border border-pebble"><div className="hidden grid-cols-[1.1fr_1.5fr_2fr_1fr_1fr] gap-4 border-b border-pebble bg-slate-50 px-4 py-3 text-[9px] font-bold uppercase tracking-[.14em] text-ash md:grid"><span>Record</span><span>Component</span><span>Work performed</span><span>Result</span><span>Logged</span></div><div className="divide-y divide-pebble">{filteredRecords.map((r) => <div key={r.id} className="grid gap-3 px-4 py-4 transition hover:bg-slate-50/70 md:grid-cols-[1.1fr_1.5fr_2fr_1fr_1fr] md:items-center md:gap-4"><div><div className="text-xs font-bold text-ink">#{r.id}</div><div className="mt-1 text-[10px] text-ash">{r.maintenance_type}</div></div><div><div className="text-xs font-semibold text-ink">Component #{r.component_id}</div><div className="mt-1 text-[10px] text-ash">By {r.technician_name}</div></div><div><div className="line-clamp-2 text-xs leading-5 text-ash">{r.description}</div>{r.parts_replaced && <div className="mt-1 text-[10px] font-medium text-ink">Parts: {r.parts_replaced}</div>}</div><div><Badge tone={RESULT_TONE[r.inspection_result]}>{r.inspection_result}</Badge></div><div className="text-[10px] text-ash md:text-right">{r.created_at}</div></div>)}</div></div>}
      </Card>
    </div>
  );
};
