import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { componentsApi } from '../services/api';
import { Component, MaintenanceRecord, VerificationLog } from '../types';
import { Cpu, ArrowLeft, Tag, Wrench, Lock, ExternalLink, Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const ComponentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<Component | null>(null);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const cid = parseInt(id, 10);
      Promise.all([
        componentsApi.getById(cid),
        componentsApi.getHistory(cid),
        componentsApi.getVerifications(cid),
      ])
        .then(([c, h, v]) => {
          setComponent(c);
          setHistory(h);
          setVerifications(v);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading component record...</div>;
  if (!component) return <div className="py-12 text-center text-rose-600">Component not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/components" className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Component Catalog</span>
      </Link>

      {/* Main Header Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden border-indigo-200/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/20 text-white font-extrabold text-xl">
              <Cpu className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-900">{component.component_uuid}</h1>
                <span className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-mono font-bold text-indigo-600 border border-indigo-200/60">
                  Serial #{component.serial_number}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{component.component_type} • Manufactured by {component.manufacturer}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-slate-500 font-medium">Assigned Aircraft</div>
              <div className="text-slate-800 font-bold text-sm">
                {component.aircraft_registration || 'Unassigned'}
              </div>
            </div>
            <span className="rounded-full bg-emerald-50/60 px-3.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-200/40">
              {component.status}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Maintenance History & Verification Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Maintenance History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-indigo-500" />
                <span>Digital Maintenance History</span>
              </h2>
              <Link
                to="/maintenance"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                + Log Record
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                No maintenance records logged for this component yet.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((h) => (
                  <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-white/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{h.maintenance_type}</span>
                      <span className="rounded bg-emerald-50/80 px-2.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-200/50">
                        Result: {h.inspection_result}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{h.description}</p>
                    {h.parts_replaced && (
                      <div className="text-xs text-slate-500">
                        <strong className="text-slate-700">Parts Replaced:</strong> {h.parts_replaced}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                      <span>Tech: <strong className="text-slate-700">{h.technician_name}</strong> • {h.created_at}</span>
                      <div className="flex items-center space-x-1 font-mono text-indigo-500 bg-indigo-50/40 px-2 py-0.5 rounded border border-indigo-200/40">
                        <Lock className="h-3 w-3" />
                        <span>SHA-256: {h.record_hash.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Tag & NFC Identity Binding Info */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Tag className="h-5 w-5 text-indigo-600" />
              <span>NFC Hardware Identity</span>
            </h2>

            <div className="p-4 rounded-xl border border-slate-200 bg-white/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Technology</span>
                <span className="text-xs font-bold text-indigo-600">Secure NFC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Hardware UID</span>
                <span className="text-xs font-mono font-bold text-slate-800">04:A3:91:XX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Security Protocol</span>
                <span className="text-xs font-semibold text-indigo-500">AES-128 CMAC SUN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">TagTamper Status</span>
                <span className="text-xs font-bold text-emerald-600">INTACT</span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/verify"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/20 text-xs"
              >
                <span>Run NFC Verification Scan</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Activity className="h-5 w-5 text-indigo-500" />
              <span>Verification History</span>
            </h2>

            {verifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                No verification scans logged for this component yet.
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white/60">
                    {v.final_result === 'AUTHENTIC' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : v.final_result === 'SUSPICIOUS' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800">{v.final_result}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {v.failure_reason || 'All 4 checks passed'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{v.created_at}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
