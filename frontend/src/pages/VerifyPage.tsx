import React, { useState } from 'react';
import { verificationApi } from '../services/api';
import { VerificationResponse } from '../types';
import { ScanLine, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Lock, Radio, Cpu, RefreshCw } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const [tagIdentifier, setTagIdentifier] = useState('04:A3:91:XX');
  const [scenario, setScenario] = useState('VALID');
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarios = [
    { id: 'VALID', label: '1. Valid NFC Tag & Intact Component', desc: 'All 4 security checks pass cleanly (AUTHENTIC)' },
    { id: 'UNKNOWN_TAG', label: '2. Unknown / Unregistered NFC Tag', desc: 'Tag UID not bound to any component (INVALID)' },
    { id: 'INVALID_TAG', label: '3. Invalid Cryptographic Signature', desc: 'NFC signature authentication fails (INVALID)' },
    { id: 'TAMPERED_TAG', label: '4. Physical Tamper Detected', desc: 'TagTamper wire loop severed (SUSPICIOUS)' },
    { id: 'BLOCKCHAIN_MISMATCH', label: '5. Blockchain Hash Mismatch', desc: 'Off-chain DB record modified fraudulently (SUSPICIOUS)' },
  ];

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
          <ScanLine className="h-7 w-7 text-sky-400" />
          <span>NFC Component Verification Engine</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Cryptographic tap simulation executing 4-tier security validation: NFC Auth, Identity Binding, Physical Tamper, and Blockchain Digest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tap Simulator & Scenarios (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Radio className="h-4 w-4 text-sky-400" />
              <span>NFC Hardware Tap Simulator</span>
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-400">Tag Identifier (UID)</label>
              <input
                type="text"
                value={tagIdentifier}
                onChange={(e) => setTagIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-sky-400 font-mono font-bold focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase text-slate-400">Simulation Test Scenarios</label>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenario(s.id)}
                    className={`w-full p-3 rounded-xl text-left border transition ${
                      scenario === s.id
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{s.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-sm"
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
          </div>
        </div>

        {/* Right Column: Verification Results Output (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="flex items-center space-x-3 rounded-xl bg-rose-950/50 p-4 text-sm text-rose-300 border border-rose-800/60">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && (
            <div className="glass-card rounded-2xl p-12 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 mx-auto">
                <ScanLine className="h-8 w-8" />
              </div>
              <div className="font-bold text-slate-300">Ready for Verification</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a test scenario on the left and click "Execute NFC Verification Scan" to test the 4-layer validation engine.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div
                className={`glass-card rounded-2xl p-6 border ${
                  result.status === 'AUTHENTIC'
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : result.status === 'SUSPICIOUS'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result.status === 'AUTHENTIC' ? (
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    ) : result.status === 'SUSPICIOUS' ? (
                      <AlertTriangle className="h-10 w-10 text-amber-400" />
                    ) : (
                      <XCircle className="h-10 w-10 text-rose-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Verification Result</div>
                      <h2
                        className={`text-2xl font-black ${
                          result.status === 'AUTHENTIC'
                            ? 'text-emerald-400'
                            : result.status === 'SUSPICIOUS'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {result.status}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase border ${
                      result.status === 'AUTHENTIC'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : result.status === 'SUSPICIOUS'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}
                  >
                    {result.verified ? 'VERIFIED INTACT' : 'VERIFICATION FAILED'}
                  </span>
                </div>

                {result.failure_reason && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-rose-300 font-medium flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Failure Reason: {result.failure_reason}</span>
                  </div>
                )}
              </div>

              {/* Component Info Card if matched */}
              {result.component && (
                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Matched Bound Component</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-sky-400">{result.component.id}</span>
                    <span className="text-xs text-slate-300 font-medium">Aircraft: {result.component.aircraft}</span>
                  </div>
                  <div className="text-xs text-slate-400">Serial Number: {result.component.serial_number}</div>
                </div>
              )}

              {/* 4 Security Checks Breakdown */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  4-Layer Cryptographic Security Pipeline
                </h3>

                <div className="space-y-3">
                  {/* Check 1 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center space-x-3">
                      <Radio className="h-5 w-5 text-sky-400" />
                      <div>
                        <div className="font-semibold text-xs text-slate-200">1. NFC Tag Cryptographic Auth</div>
                        <div className="text-[11px] text-slate-400">Validates tag hardware signature / SUN payload</div>
                      </div>
                    </div>
                    {result.checks.nfc_authentication ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>

                  {/* Check 2 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center space-x-3">
                      <Cpu className="h-5 w-5 text-indigo-400" />
                      <div>
                        <div className="font-semibold text-xs text-slate-200">2. Component Identity Binding</div>
                        <div className="text-[11px] text-slate-400">Verifies hardware UID mapping in Component Registry</div>
                      </div>
                    </div>
                    {result.checks.component_binding ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>

                  {/* Check 3 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-xs text-slate-200">3. Physical Tamper Seal Check</div>
                        <div className="text-[11px] text-slate-400">Evaluates TagTamper wire loop resistance / state</div>
                      </div>
                    </div>
                    {result.checks.tamper_status ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>

                  {/* Check 4 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-amber-400" />
                      <div>
                        <div className="font-semibold text-xs text-slate-200">4. Blockchain Record Hash Integrity</div>
                        <div className="text-[11px] text-slate-400">Compares off-chain maintenance hash with on-chain anchor</div>
                      </div>
                    </div>
                    {result.checks.blockchain_integrity ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
