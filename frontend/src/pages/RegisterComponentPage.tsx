import React, { useEffect, useState } from 'react';
import { aircraftApi, componentsApi } from '../services/api';
import { Aircraft } from '../types';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, AlertCircle } from 'lucide-react';

export const RegisterComponentPage: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [aircraftId, setAircraftId] = useState<number | ''>('');
  const [componentType, setComponentType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    aircraftApi.list().then(setAircraftList).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await componentsApi.create({
        aircraft_id: aircraftId === '' ? null : Number(aircraftId),
        component_type: componentType,
        serial_number: serialNumber,
        manufacturer,
      });
      navigate(`/components/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to register component');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <PlusCircle className="h-7 w-7 text-blue-600" />
          <span>Register Aircraft Component</span>
        </h1>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-200">
        {error && (
          <div className="mb-6 flex items-center space-x-3 rounded-xl bg-rose-50/50 p-4 text-sm text-rose-600 border border-rose-200/60">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Aircraft</label>
            <select
              value={aircraftId}
              onChange={(e) => setAircraftId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Unassigned (Inventory Storage) --</option>
              {aircraftList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.registration_number} ({a.model})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Component Type</label>
            <input
              type="text"
              required
              placeholder="e.g. Turbofan Engine (CFM LEAP-1A) or Avionics Flight Computer"
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hardware Serial Number</label>
              <input
                type="text"
                required
                placeholder="e.g. XZ928374"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Manufacturer</label>
              <input
                type="text"
                required
                placeholder="e.g. CFM International or Honeywell"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Registering...' : 'Register Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
