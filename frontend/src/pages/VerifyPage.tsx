import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verificationApi } from '../services/api';
import { VerificationResponse } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScanLine, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Lock, Radio, Cpu, RefreshCw } from 'lucide-react';

const scenarios = [
  { id: 'VALID', label: '1. Valid NFC Tag & Intact Component', desc: 'All 4 security checks pass cleanly (AUTHENTIC)' },
  { id: 'UNKNOWN_TAG', label: '2. Unknown / Unregistered NFC Tag', desc: 'Tag UID not bound to any component (INVALID)' },
  { id: 'INVALID_TAG', label: '3. Invalid Cryptographic Signature', desc: 'NFC signature authentication fails (INVALID)' },
  { id: 'TAMPERED_TAG', label: '4. Physical Tamper Detected', desc: 'TagTamper wire loop severed (SUSPICIOUS)' },
  { id: 'BLOCKCHAIN_MISMATCH', label: '5. Blockchain Hash Mismatch', desc: 'Off-chain DB record modified fraudulently (SUSPICIOUS)' },
];

type ResultTone = 'verified' | 'warning' | 'critical';

const statusTone = (status: VerificationResponse['status']): ResultTone =>
  status === 'AUTHENTIC' ? 'verified' : status === 'SUSPICIOUS' ? 'warning' : 'critical';

const STATUS_ICON: Record<ResultTone, React.ComponentType<{ className?: string }>> = {
  verified: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

const STATUS_BANNER_CLASSES: Record<ResultTone, string> = {
  verified: 'border-[#c9e8d7] bg-[#e9f6ef]/50',
  warning: 'border-[#f0dcae] bg-[#fbf1de]/50',
  critical: 'border-[#f0cbc7] bg-[#fbeceb]/50',
};

const STATUS_TEXT_CLASSES: Record<ResultTone, string> = {
  verified: 'text-[#0a7a4c]',
  warning: 'text-[#b5790f]',
  critical: 'text-[#b13a2f]',
};

interface CheckRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  passed: boolean;
}

const CheckRow: React.FC<CheckRowProps> = ({ icon: Icon, label, description, passed }) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl border border-pebble bg-white">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-ash" />
      <div>
        <div className="font-semibold text-xs text-ink">{label}</div>
        <div className="text-[11px] text-ash">{description}</div>
      </div>
    </div>
    <Badge tone={passed ? 'verified' : 'critical'} className="gap-1">
      {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      <span>{passed ? 'PASSED' : 'FAILED'}</span>
    </Badge>
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
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader eyebrow="Live Verification" title="NFC Component Verification Engine" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: tap simulator & scenarios */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-5">
            <CardHeader title="NFC Hardware Tap Simulator" icon={Radio} />

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Tag Identifier (UID)</label>
              <input
                type="text"
                value={tagIdentifier}
                onChange={(e) => setTagIdentifier(e.target.value)}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2 text-sm text-ink aero-mono font-semibold focus:border-ink focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="aero-eyebrow text-[10px]">Simulation Test Scenarios</label>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenario(s.id)}
                    className={`w-full p-3 rounded-xl text-left border transition ${
                      scenario === s.id
                        ? 'bg-[#f1f1ef] border-ink/30 text-ink'
                        : 'bg-white border-pebble text-ash hover:bg-[#f7f7f5]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-ink">{s.label}</div>
                    <div className="text-[11px] text-ash mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="pill-btn pill-btn-primary w-full text-sm disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" />
                  <span>Execute NFC Verification Scan</span>
                </>
              )}
            </button>
          </Card>
        </div>

        {/* Right: verification results output */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-4 text-sm text-[#b13a2f] border border-[#f0cbc7]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!result && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-12 text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pebble bg-white text-ash mx-auto">
                    <ScanLine className="h-8 w-8" />
                  </div>
                  <div className="font-semibold text-ink">Ready for Verification</div>
                  <p className="text-xs text-ash max-w-sm mx-auto">
                    Select a test scenario on the left and click "Execute NFC Verification Scan" to test the 4-layer validation engine.
                  </p>
                </Card>
              </motion.div>
            )}

            {result && tone && StatusIcon && (
              <motion.div
                key={`${result.status}-${result.failure_reason ?? ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Overall status banner */}
                <div className={`aero-panel border p-6 ${STATUS_BANNER_CLASSES[tone]}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-10 w-10 ${STATUS_TEXT_CLASSES[tone]}`} />
                      <div>
                        <div className="aero-eyebrow text-[10px]">Verification Result</div>
                        <h2 className={`text-2xl font-semibold ${STATUS_TEXT_CLASSES[tone]}`}>{result.status}</h2>
                      </div>
                    </div>

                    <Badge tone={tone} className="px-4 py-1.5 text-xs">
                      {result.verified ? 'VERIFIED INTACT' : 'VERIFICATION FAILED'}
                    </Badge>
                  </div>

                  {result.failure_reason && (
                    <div className="mt-4 pt-4 border-t border-pebble text-xs text-[#b13a2f] font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Failure Reason: {result.failure_reason}</span>
                    </div>
                  )}
                </div>

                {/* Matched component, if any */}
                {result.component && (
                  <Card className="p-5 space-y-2">
                    <div className="aero-eyebrow text-[10px]">Matched Bound Component</div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-ink aero-mono">{result.component.id}</span>
                      <span className="text-xs text-ink font-medium">Aircraft: {result.component.aircraft}</span>
                    </div>
                    <div className="text-xs text-ash aero-mono">Serial Number: {result.component.serial_number}</div>
                  </Card>
                )}

                {/* 4-layer security pipeline */}
                <Card className="p-6 space-y-4">
                  <h3 className="aero-eyebrow text-[10px]">4-Layer Cryptographic Security Pipeline</h3>

                  <div className="space-y-3">
                    <CheckRow
                      icon={Radio}
                      label="1. NFC Tag Cryptographic Auth"
                      description="Validates tag hardware signature / SUN payload"
                      passed={result.checks.nfc_authentication}
                    />
                    <CheckRow
                      icon={Cpu}
                      label="2. Component Identity Binding"
                      description="Verifies hardware UID mapping in Component Registry"
                      passed={result.checks.component_binding}
                    />
                    <CheckRow
                      icon={ShieldCheck}
                      label="3. Physical Tamper Seal Check"
                      description="Evaluates TagTamper wire loop resistance / state"
                      passed={result.checks.tamper_status}
                    />
                    <CheckRow
                      icon={Lock}
                      label="4. Blockchain Record Hash Integrity"
                      description="Compares off-chain maintenance hash with on-chain anchor"
                      passed={result.checks.blockchain_integrity}
                    />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
