import React, { useEffect, useState } from 'react';
import { componentsApi, maintenanceApi, verificationApi } from '../services/api';
import { Component, MaintenanceRecord } from '../types';
import { Wrench, Lock, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

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

  useEffect(() => {
    componentsApi.list().then(setComponents).catch(console.error);
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
    } finally {
      setVerifyingHash(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <Wrench className="h-7 w-7 text-indigo-400" />
          <span>Technician Maintenance & SHA-256 Digest Portal</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Log aircraft maintenance events. Backend automatically computes an immutable SHA-256 digest and anchors the proof on-chain.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
        {error && (
          <div className="flex items-center space-x-3 rounded-xl bg-rose-950/50 p-4 text-sm text-rose-300 border border-rose-800/60">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Component</label>
            <select
              required
              value={componentId}
              onChange={(e) => setComponentId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Maintenance Type</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="INSPECTION">Routine Line Inspection</option>
                <option value="REPAIR">Component Repair</option>
                <option value="OVERHAUL">Major Depot Overhaul</option>
                <option value="REPLACEMENT">Component Replacement</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inspection Result</label>
              <select
                value={inspectionResult}
                onChange={(e) => setInspectionResult(e.target.value as 'PASSED' | 'FAILED' | 'WARNING')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none font-semibold text-emerald-400"
              >
                <option value="PASSED">PASSED — Airworthy</option>
                <option value="WARNING">WARNING — Monitor</option>
                <option value="FAILED">FAILED — Unserviceable</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Work Performed Description</label>
            <textarea
              required
              rows={3}
              placeholder="Describe work completed, measurements, pressures, and sensor test results..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Parts Replaced (Optional)</label>
            <input
              type="text"
              placeholder="e.g. High Pressure Turbine Seal (PN: HPT-882)"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-sky-400 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Anchoring Record...' : 'Submit Log & Compute Hash'}
            </button>
          </div>
        </form>
      </div>

      {/* Resulting Hash & Blockchain Verification Card */}
      {createdRecord && (
        <div className="glass-card rounded-2xl p-6 border-indigo-500/40 bg-indigo-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Record Logged & Cryptographically Anchored</span>
            </div>
            <span className="text-xs text-slate-400">Record #{createdRecord.id}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
            <div className="text-xs text-slate-400 uppercase font-semibold">Generated Off-Chain Record Hash (SHA-256)</div>
            <div className="font-mono text-xs text-sky-400 font-bold break-all bg-slate-950 p-2.5 rounded border border-slate-800">
              {createdRecord.record_hash}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={verifyBlockchainHash}
              disabled={verifyingHash}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600/30 border border-indigo-500/50 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600/40 transition"
            >
              <Lock className="h-4 w-4 text-indigo-400" />
              <span>{verifyingHash ? 'Comparing Hashes...' : 'Verify Hash Against Blockchain Anchor'}</span>
            </button>

            {blockchainVerified !== null && (
              <span className={`text-xs font-bold ${blockchainVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                {blockchainVerified ? '✓ Hashes Match Perfectly (100% Intact)' : '⚠ Hash Mismatch Fraud Detected!'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
