import React, { useEffect, useState } from 'react';
import { componentsApi } from '../services/api';
import { VerificationLog } from '../types';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, XCircle, Radio, Lock } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch logs from component 1 for demonstration
    componentsApi.getVerifications(1)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <ShieldAlert className="h-7 w-7 text-rose-400" />
          <span>Security Audit Trail & Tamper Monitoring</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Cryptographic security verification logs, physical TagTamper alerts, and blockchain hash mismatch events.
        </p>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 border-sky-900/40">
          <div className="flex items-center space-x-3 mb-2">
            <Radio className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-slate-200 text-sm">NTAG 424 DNA SUN</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generates a dynamic 128-bit AES CMAC signature per NFC tap to prevent replay attacks and tag cloning.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border-emerald-900/40">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-200 text-sm">TagTamper Physical Loop</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Monitors physical wire resistance loop. Detection of wire breakage automatically updates tamper status to TAMPERED.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border-amber-900/40">
          <div className="flex items-center space-x-3 mb-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-slate-200 text-sm">Off-Chain Proof Digest</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Off-chain PostgreSQL maintenance records are anchored on-chain. Mismatch indicates database tampering.
          </p>
        </div>
      </div>

      {/* Verification Audit Stream */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-indigo-400" />
          <span>Verification Log Stream</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading audit stream...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
            No verification scans logged yet today.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {logs.map((log) => (
              <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {log.final_result === 'AUTHENTIC' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                  ) : log.final_result === 'SUSPICIOUS' ? (
                    <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                      <span>Result: {log.final_result}</span>
                      <span className="text-[11px] font-normal text-slate-500">• Scan Log #{log.id}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {log.failure_reason || 'All 4 verification checks passed'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                  <span>Timestamp: {log.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
