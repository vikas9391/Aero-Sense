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
          <Card className="overflow-hidden">
            <div className="border-b border-pebble bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-indigo-700"><Activity className="h-5 w-5" /></div>
                    <div>
                      <div className="aero-eyebrow text-[10px]">AEROSENSE AI</div>
                      <h2 className="text-lg font-semibold text-ink">Predictive Component Health</h2>
                    </div>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">Estimate remaining useful life from the 18 NASA C-MAPSS model features stored for this component.</p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full border border-[#f0d9a5] bg-[#fff9eb] px-3 py-1.5 text-[10px] font-semibold text-[#805b13]">RESEARCH PROTOTYPE</span>
              </div>
            </div>

            <div className="bg-[#fafbff] p-6">
              <div className="grid gap-3 sm:grid-cols-3 mb-5">
                <div className="rounded-xl border border-pebble bg-white p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">1. Enter data</div>
                  <div className="mt-1 text-xs font-semibold text-ink">18 model features</div>
                </div>
                <div className="rounded-xl border border-pebble bg-white p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">2. Run model</div>
                  <div className="mt-1 text-xs font-semibold text-ink">Random Forest prediction</div>
                </div>
                <div className="rounded-xl border border-pebble bg-white p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">3. Understand result</div>
                  <div className="mt-1 text-xs font-semibold text-ink">RUL + model metrics</div>
                </div>
              </div>

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
                  } catch (readError: any) {
                    setRulFeatures(emptyFeatures);
                    if (readError.response?.status !== 404) {
                      setMlError('The saved sensor record could not be loaded. Enter valid measurements manually.');
                    }
                  }
                  setShowRulForm(true);
                } finally {
                  setMlLoading(false);
                }
              }}>{mlLoading ? 'Loading sensor data…' : 'Enter / update sensor data'}</Button>

              {mlError && !showRulForm && <div role="alert" className="mt-3 rounded-xl border border-[#f2c5c1] bg-[#fff5f4] p-3 text-xs text-[#9b2c23]">{mlError}</div>}

              {mlResult && <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-[#c7d2fe] bg-white p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">Prediction</div>
                      <div className="mt-1 text-4xl font-bold text-ink aero-mono">{Number(mlResult.predicted_rul_cycles).toFixed(2)} <span className="text-base font-semibold">cycles</span></div>
                    </div>
                    <div className="rounded-xl bg-[#f5f7ff] px-4 py-3 text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">Output unit</div>
                      <div className="text-sm font-semibold text-ink">Operating cycles</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-ash">This is the model's estimated remaining useful life for the supplied NASA C-MAPSS feature vector. It is not automatically equivalent to flights, flight hours, or calendar time.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-pebble bg-white p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">Model fit</div>
                    <div className="mt-1 text-xl font-bold text-ink aero-mono">R² 0.81</div>
                    <p className="mt-1 text-[10px] text-ash">FD001 test-set fit</p>
                  </div>
                  <div className="rounded-xl border border-pebble bg-white p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">Typical error</div>
                    <div className="mt-1 text-xl font-bold text-ink aero-mono">13.55 cycles</div>
                    <p className="mt-1 text-[10px] text-ash">MAE on uncapped test data</p>
                  </div>
                  <div className="rounded-xl border border-[#f0d9a5] bg-[#fff9eb] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#805b13]">Risk status</div>
                    <div className="mt-1 text-sm font-semibold text-ink">Not classified</div>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#805b13]">No validated aircraft risk thresholds are implemented.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-pebble bg-white p-4">
                  <div className="text-xs font-semibold text-ink">How to read this</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3 text-[11px] text-ash">
                    <div><strong className="text-ink">Prediction:</strong> estimated remaining cycles.</div>
                    <div><strong className="text-ink">R²:</strong> model fit on the test dataset.</div>
                    <div><strong className="text-ink">MAE:</strong> average absolute error in cycles.</div>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-ash">{mlResult.model} · {mlResult.dataset}. These evaluation metrics are not a success-rate percentage or a safety certification.</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-ash">{mlResult.notice}</p>
                </div>
              </div>}

              {showRulForm && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm" onClick={() => !mlLoading && setShowRulForm(false)} role="dialog" aria-modal="true" aria-labelledby="rul-dialog-title">
                  <div className="flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-pebble bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="shrink-0 border-b border-pebble px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="aero-eyebrow text-[10px]">Aero-Sense · RUL input</div>
                          <h3 id="rul-dialog-title" className="mt-1 text-base font-semibold text-ink">Enter model measurements</h3>
                        </div>
                        <button type="button" disabled={mlLoading} onClick={() => setShowRulForm(false)} className="rounded-lg border border-pebble px-3 py-2 text-xs font-semibold text-ash hover:bg-[#f7f7f5] disabled:opacity-50">Close</button>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ash">Use the values from your NASA C-MAPSS feature data. The NFC tag does not provide these 18 ML inputs.</p>
                    </div>
                    <div className="overflow-y-auto px-5 py-4">
                      <div className="mb-4 rounded-xl border border-[#f0d9a5] bg-[#fff9eb] p-3 text-[11px] leading-relaxed text-[#805b13]"><strong>Data source:</strong> these are model feature fields, not generic aircraft sensor names. Use the exact feature values expected by the FD001-trained model.</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rulKeys.map(key => {
                          const labels: Record<string, { title: string; help: string }> = {
                            cycle: { title: 'Engine cycle', help: 'Operating cycle number.' },
                            setting_1: { title: 'Operating setting 1', help: 'Dataset operating condition.' },
                            setting_2: { title: 'Operating setting 2', help: 'Dataset operating condition.' },
                            sensor_2: { title: 'Sensor 2', help: 'C-MAPSS feature sensor_2.' },
                            sensor_3: { title: 'Sensor 3', help: 'C-MAPSS feature sensor_3.' },
                            sensor_4: { title: 'Sensor 4', help: 'C-MAPSS feature sensor_4.' },
                            sensor_6: { title: 'Sensor 6', help: 'C-MAPSS feature sensor_6.' },
                            sensor_7: { title: 'Sensor 7', help: 'C-MAPSS feature sensor_7.' },
                            sensor_8: { title: 'Sensor 8', help: 'C-MAPSS feature sensor_8.' },
                            sensor_9: { title: 'Sensor 9', help: 'C-MAPSS feature sensor_9.' },
                            sensor_11: { title: 'Sensor 11', help: 'C-MAPSS feature sensor_11.' },
                            sensor_12: { title: 'Sensor 12', help: 'C-MAPSS feature sensor_12.' },
                            sensor_13: { title: 'Sensor 13', help: 'C-MAPSS feature sensor_13.' },
                            sensor_14: { title: 'Sensor 14', help: 'C-MAPSS feature sensor_14.' },
                            sensor_15: { title: 'Sensor 15', help: 'C-MAPSS feature sensor_15.' },
                            sensor_17: { title: 'Sensor 17', help: 'C-MAPSS feature sensor_17.' },
                            sensor_20: { title: 'Sensor 20', help: 'C-MAPSS feature sensor_20.' },
                            sensor_21: { title: 'Sensor 21', help: 'C-MAPSS feature sensor_21.' }
                          };
                          return <label key={key} className="block rounded-xl border border-pebble bg-[#fbfcff] p-3">
                            <span className="block text-xs font-semibold text-ink">{labels[key].title}</span>
                            <span className="mt-1 block text-[10px] font-normal text-ash">{labels[key].help} <span className="aero-mono">({key})</span></span>
                            <input aria-label={labels[key].title} inputMode="decimal" type="number" step="any" value={rulFeatures[key] ?? ''} onChange={e => setRulFeatures(prev => ({...prev, [key]: e.target.value === '' ? NaN : Number(e.target.value)}))} className="mt-2 w-full rounded-lg border border-[#cbd5e1] bg-white p-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                          </label>;
                        })}
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-pebble bg-white px-5 py-4">
                      <div className="mb-3 text-[11px] text-ash">{rulKeys.filter(k => Number.isFinite(rulFeatures[k])).length} of {rulKeys.length} measurements entered</div>
                      <Button className="w-full" disabled={mlLoading || !rulKeys.every(k => Number.isFinite(rulFeatures[k]))} onClick={async () => {
                        setMlLoading(true); setMlError(null);
                        try {
                          const saved = await rulRecordApi.save(component.id, rulFeatures);
                          const result = await mlApi.predictRul(saved.features);
                          setMlResult(result); setShowRulForm(false); setMlError(null);
                        } catch (e: any) {
                          setMlError(e.response?.data?.error?.message || e.response?.data?.detail || e.message || 'Could not save sensor data or run prediction');
                        } finally {
                          setMlLoading(false);
                        }
                      }}>{mlLoading ? 'Saving & predicting…' : 'Save measurements & run prediction'}</Button>
                      <button type="button" disabled={mlLoading} onClick={() => setShowRulForm(false)} className="mt-2 w-full rounded-full border border-pebble py-3 text-sm font-semibold text-ash hover:bg-[#f7f7f5] disabled:opacity-50">Cancel</button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
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
