import React, { useEffect, useMemo, useState } from 'react';
import { aircraftApi } from '../services/api';
import { Aircraft } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, AlertCircle, Building, CheckCircle2, Plane, Search, ShieldCheck, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AircraftPage: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [regNum, setRegNum] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const canAdd = user?.role === 'COMPANY_ADMIN';

  const fetchAircraft = async () => {
    try {
      const data = await aircraftApi.list();
      setAircraftList(data);
    } catch (err) {
      console.error('Failed to load aircraft:', err);
      showToast("Couldn't load the aircraft fleet. Please refresh the page.", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAircraft(); }, []);

  const filteredAircraft = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return aircraftList;
    return aircraftList.filter((ac) => `${ac.registration_number} ${ac.model} ${ac.manufacturer}`.toLowerCase().includes(term));
  }, [aircraftList, search]);

  const activeCount = aircraftList.filter((ac) => ac.status === 'OPERATIONAL' || ac.status === 'ACTIVE').length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    setError(null);
    setSubmitting(true);
    try {
      await aircraftApi.create({ registration_number: regNum, model, manufacturer });
      setShowModal(false);
      setRegNum(''); setModel(''); setManufacturer('');
      await fetchAircraft();
      showToast('Aircraft registered successfully.', 'success');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create aircraft');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-w-0 space-y-7">
      <PageHeader
        eyebrow="Fleet Registry"
        title="Aircraft Fleet"
        action={canAdd ? <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /><span>Register Aircraft</span></Button> : undefined}
      />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#071827] p-6 text-white shadow-[0_24px_70px_-42px_rgba(7,24,39,.65)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-64 bg-cyan-300/5 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-cyan-300"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Fleet intelligence</div>
            <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">Every aircraft. One trusted operational view.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Track registrations, manufacturers and operational status from one clean fleet registry. Open any aircraft to follow its component and maintenance trail.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="min-w-[120px] rounded-2xl border border-white/10 bg-white/5 p-4"><div className="aero-mono text-2xl font-semibold">{aircraftList.length}</div><div className="mt-1 text-[10px] uppercase tracking-[.16em] text-slate-400">Registered</div></div>
            <div className="min-w-[120px] rounded-2xl border border-white/10 bg-white/5 p-4"><div className="aero-mono text-2xl font-semibold">{activeCount}</div><div className="mt-1 text-[10px] uppercase tracking-[.16em] text-slate-400">Operational</div></div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Registered fleet</h3>
          <p className="mt-1 text-xs text-ash">Select an aircraft to inspect its identity and records.</p>
        </div>
        <label className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search registration, model..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" />
        </label>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white" />)}</div>
      ) : filteredAircraft.length === 0 ? (
        <Card className="p-10 text-center sm:p-14"><Plane className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 font-semibold text-ink">{search ? 'No matching aircraft' : 'No aircraft registered yet'}</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-ash">{search ? 'Try another registration number, model or manufacturer.' : 'Register the first aircraft to begin building your digital fleet registry.'}</p>{canAdd && !search && <div className="mt-5"><Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Register Aircraft</Button></div>}</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAircraft.map((ac) => (
            <Card key={ac.id} className="group p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600"><Plane className="h-5 w-5" /></div>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700"><CheckCircle2 className="h-3 w-3" />{ac.status}</span>
              </div>
              <div className="mt-6">
                <div className="aero-mono text-[11px] font-bold uppercase tracking-[.14em] text-indigo-600">{ac.registration_number}</div>
                <h3 className="mt-1.5 truncate font-display text-xl font-semibold text-ink" title={ac.model}>{ac.model}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-ash"><Building className="h-3.5 w-3.5" /><span className="truncate">{ac.manufacturer}</span></div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-pebble pt-4">
                <div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-400">Aircraft identity</div><div className="mt-1 truncate aero-mono text-[10px] text-ash">{ac.aircraft_uuid.substring(0, 12)}...</div></div>
                <Link to={`/aircraft/${ac.id}`} className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-ink transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700"><span>Inspect</span><ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && canAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><div className="aero-eyebrow">Fleet registry</div><h2 className="mt-1 font-display text-xl font-semibold text-ink">Register aircraft</h2></div><button type="button" onClick={() => setShowModal(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-ink"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleCreate} className="space-y-5 p-6">
              {error && <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className="aero-eyebrow text-[10px]">Registration number</label><input autoFocus type="text" required placeholder="e.g. VT-ABC" value={regNum} onChange={(e) => setRegNum(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" /></div>
                <div><label className="aero-eyebrow text-[10px]">Model</label><input type="text" required placeholder="e.g. A320neo" value={model} onChange={(e) => setModel(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" /></div>
                <div><label className="aero-eyebrow text-[10px]">Manufacturer</label><input type="text" required placeholder="e.g. Airbus" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10" /></div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-[11px] leading-5 text-indigo-800"><ShieldCheck className="h-4 w-4 shrink-0" />The aircraft identity will be added to the authenticated company fleet registry.</div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button type="submit" disabled={submitting} className="pill-btn pill-btn-primary disabled:opacity-50">{submitting ? 'Registering...' : 'Register aircraft'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
