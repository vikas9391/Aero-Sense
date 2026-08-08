import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aircraftApi } from '../services/api';
import { AircraftWithComponents } from '../types';
import { Plane, Cpu, ArrowLeft, Building, Calendar, ShieldCheck, Plus } from 'lucide-react';

export const AircraftDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AircraftWithComponents | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      aircraftApi.getById(parseInt(id, 10))
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="py-12 text-center text-slate-400">Loading aircraft details...</div>;
  if (!data) return <div className="py-12 text-center text-rose-400">Aircraft not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/aircraft" className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-400 hover:text-sky-300">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Fleet List</span>
      </Link>

      {/* Main Aircraft Header Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden border-sky-900/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/10">
              <Plane className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-100">{data.registration_number}</h1>
                <span className="rounded-full bg-emerald-950/60 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800/40">
                  {data.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{data.model} • Manufactured by {data.manufacturer}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-slate-500 font-medium">Aircraft UUID</div>
              <div className="font-mono text-slate-200 font-bold">{data.aircraft_uuid}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Attached Components</div>
              <div className="text-slate-200 font-bold text-base">{data.components.length} Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attached Components List */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-sky-400" />
            <span>Bound Aircraft Components</span>
          </h2>
          <Link
            to="/components/register"
            className="flex items-center space-x-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Component</span>
          </Link>
        </div>

        {data.components.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
            No components currently assigned to this aircraft registration.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.components.map((c) => (
              <Link
                key={c.id}
                to={`/components/${c.id}`}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 transition block space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-sky-400">{c.component_uuid}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    SN: {c.serial_number}
                  </span>
                </div>
                <div className="font-semibold text-slate-200 text-sm">{c.component_type}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{c.manufacturer}</span>
                  <span className="text-emerald-400 font-medium flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{c.status}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
