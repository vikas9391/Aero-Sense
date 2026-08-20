import React, { useEffect, useState } from 'react';
import { verificationApi } from '../services/api';
import { VerificationLog } from '../types';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, XCircle, Radio, Lock } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Company-wide verification log stream (all components, not just one)
    verificationApi.listLogs()
      .then(setLogs)
      .catch((err) => {
        console.error(err);
        showToast('Couldn\'t load the security audit log.', 'error');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <ShieldAlert className="h-7 w-7 text-rose-600" />
          <span>Security Audit Trail & Tamper Monitoring</span>
        </h1>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 border-indigo-200/40">
          <div className="flex items-center space-x-3 mb-2">
            <Radio className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">NTAG 424 DNA SUN</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generates a dynamic 128-bit AES CMAC signature per NFC tap to prevent replay attacks and tag cloning.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border-emerald-200/40">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">TagTamper Physical Loop</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monitors physical wire resistance loop. Detection of wire breakage automatically updates tamper status to TAMPERED.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border-amber-200/40">
          <div className="flex items-center space-x-3 mb-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">Off-Chain Proof Digest</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Off-chain PostgreSQL maintenance records are anchored on-chain. Mismatch indicates database tampering.
          </p>
        </div>
      </div>

      {/* Verification Audit Stream */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-indigo-500" />
          <span>Verification Log Stream</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading audit stream...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            No verification scans logged yet today.
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80">
            {logs.map((log) => (
              <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {log.final_result === 'AUTHENTIC' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  ) : log.final_result === 'SUSPICIOUS' ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                      <span>Result: {log.final_result}</span>
                      <span className="text-[11px] font-normal text-slate-500">• Scan Log #{log.id}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
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
