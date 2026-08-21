import React, { useEffect, useState } from 'react';
import { verificationApi } from '../services/api';
import { VerificationLog } from '../types';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, XCircle, Radio, Lock } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';

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
      <PageHeader eyebrow="Audit & Compliance" title="Security Audit Trail & Tamper Monitoring" />

      {/* Security architecture cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-5 w-5 text-ash" />
            <h3 className="font-semibold text-ink text-sm">NTAG 424 DNA SUN</h3>
          </div>
          <p className="text-xs text-ash leading-relaxed">
            Generates a dynamic 128-bit AES CMAC signature per NFC tap to prevent replay attacks and tag cloning.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-5 w-5 text-ash" />
            <h3 className="font-semibold text-ink text-sm">TagTamper Physical Loop</h3>
          </div>
          <p className="text-xs text-ash leading-relaxed">
            Monitors physical wire resistance loop. Detection of wire breakage automatically updates tamper status to TAMPERED.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-5 w-5 text-ash" />
            <h3 className="font-semibold text-ink text-sm">Off-Chain Proof Digest</h3>
          </div>
          <p className="text-xs text-ash leading-relaxed">
            Off-chain PostgreSQL maintenance records are anchored on-chain. Mismatch indicates database tampering.
          </p>
        </Card>
      </div>

      {/* Verification audit stream */}
      <Card className="p-6">
        <CardHeader title="Verification Log Stream" icon={Activity} />

        {loading ? (
          <div className="py-8 text-center text-ash text-xs">Loading audit stream...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pebble p-8 text-center text-xs text-ash">
            No verification scans logged yet today.
          </div>
        ) : (
          <div className="divide-y divide-pebble">
            {logs.map((log) => (
              <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {log.final_result === 'AUTHENTIC' ? (
                    <CheckCircle2 className="h-6 w-6 text-[#0a7a4c] shrink-0" />
                  ) : log.final_result === 'SUSPICIOUS' ? (
                    <AlertTriangle className="h-6 w-6 text-[#b5790f] shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-[#b13a2f] shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-sm text-ink flex items-center gap-2">
                      <span>Result: {log.final_result}</span>
                      <span className="text-[11px] font-normal text-ash">• Scan Log #{log.id}</span>
                    </div>
                    <div className="text-xs text-ash mt-0.5">
                      {log.failure_reason || 'All 4 verification checks passed'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] aero-mono text-ash">
                  <span>Timestamp: {log.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
