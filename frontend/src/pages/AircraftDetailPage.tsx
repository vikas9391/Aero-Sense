import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aircraftApi } from '../services/api';
import { AircraftWithComponents } from '../types';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plane, Cpu, ArrowLeft, ShieldCheck, Plus } from 'lucide-react';

export const AircraftDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AircraftWithComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      aircraftApi.getById(parseInt(id, 10))
        .then(setData)
        .catch((err) => {
          console.error(err);
          showToast('Couldn\'t load this aircraft\'s details.', 'error');
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="py-12 text-center text-ash text-sm">Loading aircraft details...</div>;
  if (!data) return <div className="py-12 text-center text-[#b13a2f] text-sm">Aircraft not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/aircraft" className="inline-flex items-center gap-2 text-xs font-semibold text-ink hover:text-ash">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Fleet List</span>
      </Link>

      {/* Main aircraft header banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
              <Plane className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-ink aero-mono">{data.registration_number}</h1>
                <Badge tone="verified">{data.status}</Badge>
              </div>
              <p className="text-sm text-ash mt-1">{data.model} • Manufactured by {data.manufacturer}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-pebble pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="aero-eyebrow text-[10px]">Aircraft UUID</div>
              <div className="aero-mono text-ink font-semibold text-sm">{data.aircraft_uuid}</div>
            </div>
            <div>
              <div className="aero-eyebrow text-[10px]">Attached Components</div>
              <div className="text-ink font-semibold text-base">{data.components.length} Items</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Attached components list */}
      <Card className="p-6">
        <CardHeader
          title="Bound Aircraft Components"
          icon={Cpu}
          action={
            <Link to="/components/register" className="flex items-center gap-1 text-xs font-semibold text-ink hover:text-ash">
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Component</span>
            </Link>
          }
        />

        {data.components.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pebble p-8 text-center text-xs text-ash">
            No components currently assigned to this aircraft registration.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.components.map((c) => (
              <Link
                key={c.id}
                to={`/components/${c.id}`}
                className="p-4 rounded-xl border border-pebble bg-white hover:bg-[#f7f7f5] transition block space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-ink aero-mono">{c.component_uuid}</span>
                  <span className="rounded border border-pebble bg-[#f7f7f5] px-2 py-0.5 text-[10px] font-semibold text-ink aero-mono">
                    SN: {c.serial_number}
                  </span>
                </div>
                <div className="font-semibold text-ink text-sm">{c.component_type}</div>
                <div className="flex items-center justify-between text-xs text-ash pt-1">
                  <span>{c.manufacturer}</span>
                  <span className="text-[#0a7a4c] font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{c.status}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
