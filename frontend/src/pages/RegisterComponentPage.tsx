import React, { useEffect, useState } from 'react';
import { aircraftApi, componentsApi } from '../services/api';
import { Aircraft } from '../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

export const RegisterComponentPage: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [aircraftId, setAircraftId] = useState<number | ''>('');
  const [componentType, setComponentType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    aircraftApi.list().then(setAircraftList).catch((err) => {
      console.error(err);
      showToast('Couldn\'t load the aircraft list for this form.', 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <PageHeader eyebrow="Component Registry" title="Register Aircraft Component" />

      <Card className="p-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-4 text-sm text-[#b13a2f] border border-[#f0cbc7]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="aero-eyebrow text-[10px]">Assigned Aircraft</label>
            <select
              value={aircraftId}
              onChange={(e) => setAircraftId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
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
            <label className="aero-eyebrow text-[10px]">Component Type</label>
            <input
              type="text"
              required
              placeholder="e.g. Turbofan Engine (CFM LEAP-1A) or Avionics Flight Computer"
              value={componentType}
              onChange={(e) => setComponentType(e.target.value)}
              className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Hardware Serial Number</label>
              <input
                type="text"
                required
                placeholder="e.g. XZ928374"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none aero-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Manufacturer</label>
              <input
                type="text"
                required
                placeholder="e.g. CFM International or Honeywell"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-pebble flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="pill-btn pill-btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Component'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
