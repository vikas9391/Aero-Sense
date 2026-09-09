import React, { useEffect, useMemo, useState } from 'react';
import { componentsApi } from '../services/api';
import { Component } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Search, ShieldCheck, ArrowRight, Plane, Tag, Activity, Layers3, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ComponentsPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const canRegister = user?.role === 'COMPANY_ADMIN' || user?.role === 'MANUFACTURER';

  useEffect(() => {
    componentsApi.list()
      .then(setComponents)
      .catch((err) => {
        console.error(err);
        showToast('Couldn\'t load the component catalog. Please refresh the page.', 'error');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return components;
    return components.filter((c) =>
      [c.component_uuid, c.serial_number, c.component_type, c.manufacturer, c.aircraft_registration || '']
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [components, search]);

  const operational = components.filter((c) => c.status === 'OPERATIONAL').length;
  const assigned = components.filter((c) => Boolean(c.aircraft_registration)).length;
  const unassigned = components.length - assigned;

  const metrics: Array<{
    label: string;
    value: number;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: 'Tracked', value: components.length, Icon: Layers3 },
    { label: 'Operational', value: operational, Icon: ShieldCheck },
    { label: 'Assigned', value: assigned, Icon: Plane },
  ];

  return (
    <div className="min-w-0 space-y-7">
      <PageHeader
        eyebrow="Digital Identity Registry"
        title="Aircraft Components"
        action={canRegister ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/nfc/register" className="inline-flex items-center gap-2 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9c9d1] hover:shadow-md">
              <Tag className="h-4 w-4 text-accent" /><span>Bind NFC / RFID</span>
            </Link>
            <Button to="/components/register"><Plus className="h-4 w-4" /><span>Register Component</span></Button>
          </div>
        ) : undefined}
      />

      <section className="relative overflow-hidden rounded-[26px] bg-[#071218] px-5 py-6 text-white shadow-[0_24px_70px_-35px_rgba(7,18,24,.65)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_85%_20%,rgba(42,119,199,.34),transparent_32%),linear-gradient(120deg,transparent,rgba(255,255,255,.025))]" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-sky-300"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" />Component identity layer</div>
            <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">Every component gets a persistent digital identity.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Track physical hardware, aircraft assignment and NFC-backed identity from one controlled registry.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {metrics.map(({ label, value, Icon }) => (
              <div key={label} className="min-w-[86px] rounded-2xl border border-white/10 bg-white/[.06] px-3 py-3 backdrop-blur-sm">
                <Icon className="mb-3 h-4 w-4 text-sky-300" />
                <div className="font-display text-xl font-semibold">{loading ? '—' : value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search component ID, serial, type, manufacturer or aircraft..." className="w-full rounded-2xl border border-pebble bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-ink shadow-[0_12px_35px_-28px_rgba(7,18,24,.45)] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" />
        </div>
        <div className="flex items-center gap-2 text-xs text-ash"><Activity className="h-3.5 w-3.5" /><span>{loading ? 'Synchronizing registry…' : `${filtered.length} of ${components.length} records shown`}</span></div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-56 animate-pulse rounded-[22px] border border-pebble bg-white" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center sm:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-pebble bg-accent-soft"><ScanLine className="h-6 w-6 text-accent" /></div>
          <h3 className="mt-4 font-display text-lg font-semibold text-ink">{search ? 'No matching components' : 'No components registered'}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-ash">{search ? 'Try another identifier, serial number or aircraft registration.' : 'Register a component or bind an NFC tag to start building the digital registry.'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="group flex min-w-0 flex-col justify-between p-5 sm:p-6">
              <div className="space-y-5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#0a9b83]" /><span className="text-[10px] font-bold uppercase tracking-[.18em] text-ash">Identity active</span></div>
                    <h3 className="truncate font-display text-lg font-semibold tracking-tight text-ink" title={c.component_uuid}>{c.component_uuid}</h3>
                  </div>
                  <span className="shrink-0 rounded-lg border border-pebble bg-[var(--bg-app)] px-2.5 py-1.5 text-[10px] font-bold text-ink aero-mono">SN {c.serial_number}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{c.component_type}</div>
                  <div className="mt-1 text-xs text-ash">{c.manufacturer}</div>
                </div>
                <div className="rounded-2xl border border-pebble bg-[var(--bg-app)] p-3.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ash"><Plane className="h-3.5 w-3.5 text-accent" /> Aircraft assignment</div>
                  <div className="mt-2 truncate text-sm font-semibold text-ink">{c.aircraft_registration || 'Unassigned'}</div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-pebble pt-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0a7a4c]"><ShieldCheck className="h-3.5 w-3.5" />{c.status}</span>
                <Link to={`/components/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink transition group-hover:bg-accent-soft group-hover:text-accent"><span>Open passport</span><ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
      {unassigned > 0 && !loading && <div className="text-center text-xs text-ash">{unassigned} component{unassigned === 1 ? '' : 's'} currently awaiting aircraft assignment.</div>}
    </div>
  );
};
