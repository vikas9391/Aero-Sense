import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { componentsApi, mlApi, rulRecordApi } from '../services/api';
import { Component, MaintenanceRecord, VerificationLog } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Cpu, ArrowLeft, Tag, Wrench, Lock, ExternalLink, Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const ComponentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<Component | null>(null);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResult, setMlResult] = useState<any>(null);
  const [mlError, setMlError] = useState<string | null>(null);
  const [rulFeatures, setRulFeatures] = useState<Record<string, number>>({});
  const [showRulForm, setShowRulForm] = useState(false);
  const rulKeys = ['cycle','setting_1','setting_2','sensor_2','sensor_3','sensor_4','sensor_6','sensor_7','sensor_8','sensor_9','sensor_11','sensor_12','sensor_13','sensor_14','sensor_15','sensor_17','sensor_20','sensor_21'];
  const { showToast } = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canMaintain = role === 'COMPANY_ADMIN' || role === 'MAINTENANCE_TECHNICIAN';
  const canVerify = role === 'COMPANY_ADMIN' || role === 'MANUFACTURER' || role === 'MAINTENANCE_TECHNICIAN' || role === 'INSPECTOR';

  useEffect(() => {
    if (!id) return;
    const cid = parseInt(id, 10);
    const load = async () => {
      try {
        const c = await componentsApi.getById(cid);
        setComponent(c);
        if (canMaintain) {
          try { setHistory(await componentsApi.getHistory(cid)); } catch (_) { setHistory([]); }
        } else {
          setHistory([]);
        }
        if (canVerify) {
          try { setVerifications(await componentsApi.getVerifications(cid)); } catch (_) { setVerifications([]); }
        } else {
          setVerifications([]);
        }
      } catch (err) {
        console.error(err);
        showToast('Couldn\'t load this component\'s record.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, canMaintain, canVerify, showToast]);

  useEffect(() => {
    if (!showRulForm) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !mlLoading) setShowRulForm(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRulForm, mlLoading]);

  if (loading) return <div className="py-12 text-center text-ash text-sm">Loading component record...</div>;
  if (!component) return <div className="py-12 text-center text-[#b13a2f] text-sm">Component not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/components" className="inline-flex items-center gap-2 text-xs font-semibold text-ink hover:text-ash"><ArrowLeft className="h-4 w-4" /><span>Back to Component Catalog</span></Link>
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white"><Cpu className="h-7 w-7" /></div>
            <div>
              <div className="aero-eyebrow mb-1">Component Digital Passport</div>
              <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold text-ink aero-mono">{component.component_uuid}</h1><span className="rounded border border-pebble bg-[#f7f7f5] px-2.5 py-1 text-xs font-semibold text-ink aero-mono">Serial #{component.serial_number}</span></div>
              <p className="text-sm text-ash mt-1">{component.component_type} • Manufactured by {component.manufacturer}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-pebble pt-4 md:pt-0 md:pl-6"><div><div className="aero-eyebrow text-[10px]">Assigned Aircraft</div><div className="text-ink font-semibold text-sm aero-mono">{component.aircraft_registration || 'Unassigned'}</div></div><Badge tone="verified">{component.status}</Badge></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canMaintain && (
          <div className="lg:col-span-2">
            <Card className="p-6">
              <CardHeader title="Digital Maintenance History" icon={Wrench} action={<Link to="/maintenance" className="text-xs font-semibold text-ink hover:text-ash">+ Log Record</Link>} />
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-pebble p-8 text-center text-xs text-ash">No maintenance records logged for this component yet.</div>
              ) : (
                <div className="space-y-4">
                  {history.map((h) => (
                    <div key={h.id} className="p-4 rounded-xl border border-pebble bg-white space-y-2">
                      <div className="flex items-center justify-between"><span className="font-semibold text-ink text-sm">{h.maintenance_type}</span><Badge tone={h.inspection_result === 'PASSED' ? 'verified' : h.inspection_result === 'WARNING' ? 'warning' : 'critical'}>{h.inspection_result}</Badge></div>
                      <p className="text-xs text-[#3a3a40] leading-relaxed">{h.description}</p>
                      {h.parts_replaced && <div className="text-xs text-ash"><strong className="text-ink">Parts Replaced:</strong> {h.parts_replaced}</div>}
                      <div className="pt-2 border-t border-pebble flex flex-wrap items-center justify-between text-[11px] text-ash gap-2"><span>Tech: <strong className="text-ink">{h.technician_name}</strong> • {h.created_at}</span><div className="flex items-center gap-1 aero-mono text-ink bg-[#f7f7f5] px-2 py-0.5 rounded border border-pebble"><Lock className="h-3 w-3" /><span>SHA-256: {h.record_hash.substring(0, 16)}...</span></div></div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        <div className={canMaintain ? 'lg:col-span-3 mx-auto w-full max-w-3xl space-y-6' : 'lg:col-span-2 mx-auto w-full max-w-3xl space-y-6'}>
          <Card className="p-6">
            <CardHeader title="AI Predictive Health · RUL Model" icon={Activity} />
            <p className="text-xs text-ash mb-3">Prediction uses the saved sensor record for this component. If no valid record exists, enter the measurements manually.</p>
            <div className="rounded-xl border border-[#f0d9a5] bg-[#fff9eb] p-3 text-[11px] text-[#805b13] mb-4">Research prototype on NASA C-MAPSS data · Not validated for aircraft maintenance or airworthiness decisions.</div>
            <Button className="w-full" disabled={mlLoading} onClick={async () => {
              setMlLoading(true); setMlError(null); setMlResult(null);
              try {
                const emptyFeatures = Object.fromEntries(rulKeys.map(key => [key, NaN])) as Record<string, number>;
                try {
                  const saved = await rulRecordApi.get(component.id);
                  const existing = saved.features || {};
                  setRulFeatures(Object.fromEntries(rulKeys.map(key => [
                    key,
                    typeof existing[key] === 'number' && Number.isFinite(existing[key]) ? existing[key] : NaN
                  ])) as Record<string, number>);
                  setMlError('Saved measurements loaded. Review or change them, then save and predict.');
                } catch (readError: any) {
                  if (readError.response?.status === 404) {
                    setRulFeatures(emptyFeatures);
                    setMlError('No saved sensor record found. Enter the 18 measurements to save and predict.');
                  } else {
                    setRulFeatures(emptyFeatures);
                    setMlError('Could not load the saved record. Enter measurements manually; saving will replace the record.');
                  }
                }
                setShowRulForm(true);
              } finally {
                setMlLoading(false);
              }
            }}>{mlLoading ? 'Loading measurements…' : 'Update sensor data & predict RUL'}</Button>
            {mlError && <p className="mt-3 text-xs text-[#b13a2f]">{mlError}</p>}
            {showRulForm && createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6 backdrop-blur-sm" onClick={() => !mlLoading && setShowRulForm(false)} role="dialog" aria-modal="true" aria-labelledby="rul-dialog-title"><div className="flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-pebble bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="shrink-0 border-b border-pebble bg-white px-5 py-4"><div className="flex items-center justify-between gap-4"><div><div className="aero-eyebrow text-[10px]">Aero-Sense · RUL input</div><h3 id="rul-dialog-title" className="mt-1 text-base font-semibold text-ink">Review sensor measurements</h3></div><button type="button" disabled={mlLoading} onClick={() => setShowRulForm(false)} className="rounded-lg border border-pebble px-3 py-2 text-xs font-semibold text-ash hover:bg-[#f7f7f5] disabled:opacity-50">Close</button></div><p className="mt-2 text-xs leading-relaxed text-ash">Saved values are prefilled when available. Enter measured NASA C-MAPSS values only. Do not guess values or enter an NFC UID, part number, or maintenance description.</p></div>
              <div className="overflow-y-auto px-5 py-4"><div className="mb-3 rounded-lg border border-[#f0d9a5] bg-[#fff9eb] p-3 text-[11px] leading-relaxed text-[#805b13]"><strong>Important:</strong> These 18 fields are model features from a simulated engine dataset. They are not automatically collected by the NFC tag and may not correspond to measurements available for your real component.</div>
              {mlError && <div role="alert" className="mb-3 rounded-lg border border-[#f2c5c1] bg-[#fff5f4] p-3 text-xs text-[#9b2c23]">{mlError}</div>}
              <div className="mb-3 text-xs font-semibold text-ink">Operating conditions and sensor channels</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rulKeys.map(key => {
                  const labels: Record<string, { title: string; help: string }> = {
                    cycle: { title: 'Engine cycle number', help: 'Current operating cycle in the dataset.' },
                    setting_1: { title: 'Operating setting 1', help: 'First recorded operating-condition value.' },
                    setting_2: { title: 'Operating setting 2', help: 'Second recorded operating-condition value.' },
                    sensor_2: { title: 'Sensor channel 2', help: 'NASA C-MAPSS sensor measurement; use the dataset value.' },
                    sensor_3: { title: 'Sensor channel 3', help: 'NASA C-MAPSS sensor measurement; use the dataset value.' },
                    sensor_4: { title: 'Sensor channel 4', help: 'NASA C-MAPSS sensor measurement; use the dataset value.' },
                    sensor_6: { title: 'Sensor channel 6', help: 'NASA C-MAPSS sensor measurement; use the dataset value.' },
                    sensor_7: { title: 'Sensor 7', help: 'Sensor channel 7 measurement.' },
                    sensor_8: { title: 'Sensor 8', help: 'Sensor channel 8 measurement.' },
                    sensor_9: { title: 'Sensor 9', help: 'Sensor channel 9 measurement.' },
                    sensor_11: { title: 'Sensor 11', help: 'Sensor channel 11 measurement.' },
                    sensor_12: { title: 'Sensor 12', help: 'Sensor channel 12 measurement.' },
                    sensor_13: { title: 'Sensor 13', help: 'Sensor channel 13 measurement.' },
                    sensor_14: { title: 'Sensor 14', help: 'Sensor channel 14 measurement.' },
                    sensor_15: { title: 'Sensor 15', help: 'Sensor channel 15 measurement.' },
                    sensor_17: { title: 'Sensor 17', help: 'Sensor channel 17 measurement.' },
                    sensor_20: { title: 'Sensor 20', help: 'Sensor channel 20 measurement.' },
                    sensor_21: { title: 'Sensor 21', help: 'Sensor channel 21 measurement.' }
                  };
                  return <label key={key} className="block rounded-xl border border-pebble bg-[#fbfcff] p-3 text-xs font-semibold text-ink">
                    <span className="block">{labels[key]?.title || key}</span>
                    <span className="mt-1 block text-[10px] font-normal text-ash">{labels[key]?.help || key} <span className="aero-mono">({key})</span></span>
                    <input aria-label={labels[key]?.title || key} type="number" step="any" value={rulFeatures[key] ?? ''} onChange={e => setRulFeatures(prev => ({...prev, [key]: e.target.value === '' ? NaN : Number(e.target.value)}))} className="mt-2 w-full rounded-lg border border-[#cbd5e1] bg-white p-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                  </label>;
                })}
              </div></div>
              <div className="shrink-0 border-t border-pebble bg-white px-5 py-4"><div className="mb-3 text-[11px] text-ash">{rulKeys.filter(k => Number.isFinite(rulFeatures[k])).length} of {rulKeys.length} measurements entered</div><Button className="w-full" disabled={mlLoading || !rulKeys.every(k => Number.isFinite(rulFeatures[k]))} onClick={async () => {
                setMlLoading(true); setMlError(null);
                try {
                  const saved = await rulRecordApi.save(component.id, rulFeatures);
                  const result = await mlApi.predictRul(saved.features);
                  setMlResult(result); setShowRulForm(false); setMlError(null);
                } catch (e: any) { setMlError(e.response?.data?.error?.message || e.response?.data?.detail || e.message || 'Could not save sensor record or run prediction'); }
                finally { setMlLoading(false); }
              }}>{mlLoading ? 'Saving & predicting…' : 'Save measurements & run prediction'}</Button><button type="button" disabled={mlLoading} onClick={() => setShowRulForm(false)} className="mt-2 w-full rounded-full border border-pebble py-3 text-sm font-semibold text-ash hover:bg-[#f7f7f5] disabled:opacity-50">Cancel</button></div>
            </div>, document.body)}
            {mlResult && <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#c7d2fe] bg-[#f5f7ff] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800"><Activity className="h-4 w-4" /> MODEL PREDICTION</div>
                <div className="mt-2 text-3xl font-bold text-ink aero-mono">{Number(mlResult.predicted_rul_cycles).toFixed(2)} <span className="text-sm font-semibold">cycles remaining</span></div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700">The model estimates remaining useful life in NASA C-MAPSS operating cycles. A cycle is not automatically equal to a flight, flight hour, or calendar day.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#f0d9a5] bg-[#fff9eb] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#805b13]"><AlertTriangle className="h-4 w-4" /> RISK INTERPRETATION</div>
                  <p className="mt-2 text-sm font-semibold text-ink">No validated risk category available</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">This prototype has no approved low/medium/high risk thresholds. Do not use this number to decide whether an aircraft component is safe to operate.</p>
                </div>
                <div className="rounded-xl border border-pebble bg-white p-4">
                  <div className="text-xs font-semibold text-ink">MODEL PERFORMANCE</div>
                  <div className="mt-2 text-lg font-bold text-ink aero-mono">R² 0.81</div>
                  <p className="text-xs text-ash">Test-set fit on NASA C-MAPSS FD001</p>
                  <div className="mt-2 text-lg font-bold text-ink aero-mono">MAE 13.55 cycles</div>
                  <p className="text-xs text-ash">Average absolute error on the uncapped test set</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-ash">These are dataset evaluation metrics, not a 81% success rate or a guarantee for this prediction.</p>
                </div>
              </div>
              <div className="rounded-xl border border-pebble bg-white p-3">
                <p className="text-[10px] text-ash">{mlResult.model} · {mlResult.dataset}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-ash">{mlResult.notice}</p>
              </div>
            </div>}
          </Card>
          <Card className="p-6">
            <CardHeader title="NFC Hardware Identity" icon={Tag} />
            <div className="p-4 rounded-xl border border-pebble bg-white space-y-3">
              <div className="flex items-center justify-between"><span className="aero-eyebrow text-[10px]">Technology</span><span className="text-xs font-semibold text-ink">Secure NFC</span></div>
              <div className="flex items-center justify-between"><span className="aero-eyebrow text-[10px]">Hardware UID</span><span className="text-xs font-semibold text-ink aero-mono">04:A3:91:XX</span></div>
              <div className="flex items-center justify-between"><span className="aero-eyebrow text-[10px]">Security Protocol</span><span className="text-xs font-semibold text-ink">AES-128 CMAC SUN</span></div>
              <div className="flex items-center justify-between"><span className="aero-eyebrow text-[10px]">TagTamper Status</span><span className="text-xs font-semibold text-[#0a7a4c]">INTACT</span></div>
            </div>
            {canVerify && <div className="mt-4"><Button to="/verify" className="w-full"><span>Run NFC Verification Scan</span><ExternalLink className="h-3.5 w-3.5" /></Button></div>}
          </Card>

          {canVerify && (
            <Card className="p-6">
              <CardHeader title="Verification History" icon={Activity} />
              {verifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-pebble p-6 text-center text-xs text-ash">No verification scans logged for this component yet.</div>
              ) : (
                <div className="space-y-3">
                  {verifications.map((v) => (
                    <div key={v.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-pebble bg-white">
                      {v.final_result === 'AUTHENTIC' ? <CheckCircle2 className="h-4 w-4 text-[#0a7a4c] shrink-0 mt-0.5" /> : v.final_result === 'SUSPICIOUS' ? <AlertTriangle className="h-4 w-4 text-[#b5790f] shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-[#b13a2f] shrink-0 mt-0.5" />}
                      <div className="min-w-0"><div className="text-xs font-semibold text-ink">{v.final_result}</div><div className="text-[11px] text-ash mt-0.5">{v.failure_reason || 'All 4 checks passed'}</div><div className="text-[10px] text-ash aero-mono mt-1">{v.created_at}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
