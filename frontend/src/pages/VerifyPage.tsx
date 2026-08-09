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
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <ScanLine className="h-7 w-7 text-blue-600" />
          <span>NFC Component Verification Engine</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tap Simulator & Scenarios (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Radio className="h-4 w-4 text-blue-600" />
              <span>NFC Hardware Tap Simulator</span>
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Tag Identifier (UID)</label>
              <input
                type="text"
                value={tagIdentifier}
                onChange={(e) => setTagIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-blue-600 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase text-slate-500">Simulation Test Scenarios</label>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenario(s.id)}
                    className={`w-full p-3 rounded-xl text-left border transition ${
                      scenario === s.id
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-500'
                        : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-800">{s.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-sm"
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
            <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-4 text-sm text-rose-600 border border-rose-200/60">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && (
            <div className="glass-card rounded-2xl p-12 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 mx-auto">
                <ScanLine className="h-8 w-8" />
              </div>
              <div className="font-bold text-slate-700">Ready for Verification</div>
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
                    ? 'border-emerald-500/40 bg-emerald-50/20'
                    : result.status === 'SUSPICIOUS'
                    ? 'border-amber-500/40 bg-amber-50/20'
                    : 'border-rose-500/40 bg-rose-50/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result.status === 'AUTHENTIC' ? (
                      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    ) : result.status === 'SUSPICIOUS' ? (
                      <AlertTriangle className="h-10 w-10 text-amber-600" />
                    ) : (
                      <XCircle className="h-10 w-10 text-rose-600" />
                    )}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Result</div>
                      <h2
                        className={`text-2xl font-black ${
                          result.status === 'AUTHENTIC'
                            ? 'text-emerald-600'
                            : result.status === 'SUSPICIOUS'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {result.status}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase border ${
                      result.status === 'AUTHENTIC'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : result.status === 'SUSPICIOUS'
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}
                  >
                    {result.verified ? 'VERIFIED INTACT' : 'VERIFICATION FAILED'}
                  </span>
                </div>

                {result.failure_reason && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 text-xs text-rose-600 font-medium flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Failure Reason: {result.failure_reason}</span>
                  </div>
                )}
              </div>

              {/* Component Info Card if matched */}
              {result.component && (
                <div className="glass-card rounded-2xl p-5 border border-slate-200 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Matched Bound Component</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-blue-600">{result.component.id}</span>
                    <span className="text-xs text-slate-700 font-medium">Aircraft: {result.component.aircraft}</span>
                  </div>
                  <div className="text-xs text-slate-500">Serial Number: {result.component.serial_number}</div>
                </div>
              )}

              {/* 4 Security Checks Breakdown */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4-Layer Cryptographic Security Pipeline
                </h3>

                <div className="space-y-3">
                  {/* Check 1 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white/60">
                    <div className="flex items-center space-x-3">
                      <Radio className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-xs text-slate-800">1. NFC Tag Cryptographic Auth</div>
                        <div className="text-[11px] text-slate-500">Validates tag hardware signature / SUN payload</div>
                      </div>
                    </div>
                    {result.checks.nfc_authentication ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>

                  {/* Check 2 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white/60">
                    <div className="flex items-center space-x-3">
                      <Cpu className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-semibold text-xs text-slate-800">2. Component Identity Binding</div>
                        <div className="text-[11px] text-slate-500">Verifies hardware UID mapping in Component Registry</div>
                      </div>
                    </div>
                    {result.checks.component_binding ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>

                  {/* Check 3 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white/60">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-xs text-slate-800">3. Physical Tamper Seal Check</div>
                        <div className="text-[11px] text-slate-500">Evaluates TagTamper wire loop resistance / state</div>
                      </div>
                    </div>
                    {result.checks.tamper_status ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center space-x-1">
                        <XCircle className="h-4 w-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>

                  {/* Check 4 */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white/60">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="font-semibold text-xs text-slate-800">4. Blockchain Record Hash Integrity</div>
                        <div className="text-[11px] text-slate-500">Compares off-chain maintenance hash with on-chain anchor</div>
                      </div>
                    </div>
                    {result.checks.blockchain_integrity ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center space-x-1">
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
