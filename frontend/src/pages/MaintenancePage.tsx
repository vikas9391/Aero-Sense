import React, { useEffect, useState } from 'react';
import { componentsApi, maintenanceApi, verificationApi } from '../services/api';
import { Component, MaintenanceRecord } from '../types';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge, BadgeTone } from '../components/ui/Badge';
import { Lock, CheckCircle2, AlertCircle, History, ShieldAlert } from 'lucide-react';

const RESULT_TONE: Record<'PASSED' | 'FAILED' | 'WARNING', BadgeTone> = {
  PASSED: 'verified',
  WARNING: 'warning',
  FAILED: 'critical',
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

  const loadRecords = () => {
    setRecordsLoading(true);
    setRecordsError(null);
    maintenanceApi
      .listAll()
      .then(setRecords)
      .catch((err) => {
        console.error(err);
        setRecordsError('Failed to load maintenance history.');
      })
      .finally(() => setRecordsLoading(false));
  };

  useEffect(() => {
    componentsApi.list().then(setComponents).catch((err) => {
      console.error(err);
      showToast('Couldn\'t load the component list for this form.', 'error');
    });
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentId) {
      setError('Please select a component.');
      return;
    }
    setError(null);
    setCreatedRecord(null);
    setBlockchainVerified(null);
    setSubmitting(true);

    try {
      const rec = await maintenanceApi.create({
        component_id: Number(componentId),
        maintenance_type: maintenanceType,
        description,
        parts_replaced: partsReplaced || undefined,
        inspection_result: inspectionResult,
      });
      setCreatedRecord(rec);
      setDescription('');
      setPartsReplaced('');
      loadRecords();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit maintenance log.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyBlockchainHash = async () => {
    if (!createdRecord) return;
    setVerifyingHash(true);
    try {
      const res = await verificationApi.verifyBlockchain(createdRecord.id);
      setBlockchainVerified(res.verified);
    } catch (err) {
      console.error('Blockchain proof verification failed:', err);
      showToast('Blockchain proof verification failed. Please try again.', 'error');
    } finally {
      setVerifyingHash(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader eyebrow="Technician Portal" title="Maintenance & SHA-256 Digest Log" />

      <Card className="p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-4 text-sm text-[#b13a2f] border border-[#f0cbc7]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="aero-eyebrow text-[10px]">Target Component</label>
            <select
              required
              value={componentId}
              onChange={(e) => setComponentId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="">-- Select Target Component --</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.component_uuid} — {c.component_type} (SN: {c.serial_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Maintenance Type</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="INSPECTION">Routine Line Inspection</option>
                <option value="REPAIR">Component Repair</option>
                <option value="OVERHAUL">Major Depot Overhaul</option>
                <option value="REPLACEMENT">Component Replacement</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Inspection Result</label>
              <select
                value={inspectionResult}
                onChange={(e) => setInspectionResult(e.target.value as 'PASSED' | 'FAILED' | 'WARNING')}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm font-semibold text-[#0a7a4c] focus:border-ink focus:outline-none"
              >
                <option value="PASSED">PASSED — Airworthy</option>
                <option value="WARNING">WARNING — Monitor</option>
                <option value="FAILED">FAILED — Unserviceable</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="aero-eyebrow text-[10px]">Work Performed Description</label>
            <textarea
              required
              rows={3}
              placeholder="Describe work completed, measurements, pressures, and sensor test results..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-pebble bg-white p-4 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="aero-eyebrow text-[10px]">Parts Replaced (Optional)</label>
            <input
              type="text"
              placeholder="e.g. High Pressure Turbine Seal (PN: HPT-882)"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-pebble flex justify-end">
            <button type="submit" disabled={submitting} className="pill-btn pill-btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Anchoring Record...' : 'Submit Log & Compute Hash'}
            </button>
          </div>
        </form>
      </Card>

      {/* Resulting hash & blockchain verification */}
      {createdRecord && (
        <Card className="p-6 border-[#c9dcec] bg-[#eaf1f8]/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#0a7a4c] font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Record Logged & Cryptographically Anchored</span>
            </div>
            <span className="text-xs text-ash">Record #{createdRecord.id}</span>
          </div>

          <div className="p-4 rounded-xl border border-pebble bg-white space-y-2">
            <div className="aero-eyebrow text-[10px]">Generated Off-Chain Record Hash (SHA-256)</div>
            <div className="aero-mono text-xs text-ink font-semibold break-all bg-[#f7f7f5] p-2.5 rounded border border-pebble">
              {createdRecord.record_hash}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <button
              onClick={verifyBlockchainHash}
              disabled={verifyingHash}
              className="flex items-center gap-2 rounded-xl border border-pebble bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-[#f7f7f5] transition disabled:opacity-50"
            >
              <Lock className="h-4 w-4 text-ash" />
              <span>{verifyingHash ? 'Comparing Hashes...' : 'Verify Hash Against Blockchain Anchor'}</span>
            </button>

            {blockchainVerified !== null && (
              <Badge tone={blockchainVerified ? 'verified' : 'critical'} className="gap-1.5">
                {blockchainVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                <span>{blockchainVerified ? 'Hashes Match — 100% Intact' : 'Hash Mismatch — Fraud Detected'}</span>
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Company maintenance history */}
      <Card className="p-6">
        <CardHeader title="Maintenance History" icon={History} />

        {recordsError && (
          <div className="flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-4 text-sm text-[#b13a2f] border border-[#f0cbc7] mb-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{recordsError}</span>
          </div>
        )}

        {recordsLoading ? (
          <div className="py-8 text-center text-ash text-xs">Loading maintenance history...</div>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pebble p-8 text-center text-xs text-ash">
            No maintenance records logged yet.
          </div>
        ) : (
          <div className="divide-y divide-pebble">
            {records.map((r) => (
              <div key={r.id} className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-ink flex items-center gap-2 flex-wrap">
                    <span>{r.maintenance_type}</span>
                    <Badge tone={RESULT_TONE[r.inspection_result]}>{r.inspection_result}</Badge>
                    <span className="text-[11px] font-normal text-ash">• Record #{r.id}</span>
                  </div>
                  <div className="text-xs text-ash mt-1">{r.description}</div>
                  {r.parts_replaced && (
                    <div className="text-xs text-ash mt-0.5">Parts: {r.parts_replaced}</div>
                  )}
                  <div className="text-[11px] text-ash/80 mt-1">
                    Component #{r.component_id} • Logged by {r.technician_name}
                  </div>
                </div>
                <div className="text-[11px] aero-mono text-ash shrink-0">{r.created_at}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
