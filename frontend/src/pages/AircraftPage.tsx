import React, { useEffect, useState } from 'react';
import { aircraftApi } from '../services/api';
import { Aircraft } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AircraftPage: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const canAdd = user?.role === 'COMPANY_ADMIN' || user?.role === 'MANUFACTURER';

  const fetchAircraft = async () => {
    try {
      const data = await aircraftApi.list();
      setAircraftList(data);
    } catch (err) {
      console.error('Failed to load aircraft:', err);
      showToast('Couldn\'t load the aircraft fleet. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAircraft();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await aircraftApi.create({
        registration_number: regNum,
        model,
        manufacturer,
      });
      setShowModal(false);
      setRegNum('');
      setModel('');
      setManufacturer('');
      fetchAircraft();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create aircraft');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet Registry"
        title="Aircraft Fleet Overview"
        action={
          canAdd && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              <span>Register Aircraft</span>
            </Button>
          )
        }
      />

      {loading ? (
        <div className="text-center py-12 text-ash text-sm">Loading aircraft fleet...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aircraftList.map((ac) => (
            <Card key={ac.id} className="p-6 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-lg border border-pebble bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-ink aero-mono">
                    {ac.registration_number}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#0a7a4c]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{ac.status}</span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-ink">{ac.model}</h3>
                <div className="flex items-center gap-2 text-xs text-ash mt-1">
                  <Building className="h-3.5 w-3.5 text-ash" />
                  <span>{ac.manufacturer}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-pebble flex items-center justify-between">
                <span className="text-[11px] text-ash aero-mono">UUID: {ac.aircraft_uuid.substring(0, 8)}...</span>
                <Link
                  to={`/aircraft/${ac.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-ink hover:text-ash"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for creating aircraft */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="aero-panel bg-white max-w-md w-full p-6 space-y-6">
            <h2 className="text-xl font-semibold text-ink">Register New Aircraft</h2>
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#fbeceb]/60 p-3 text-xs text-[#b13a2f] border border-[#f0cbc7]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="aero-eyebrow text-[10px]">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A320-002 or N9824X"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="aero-eyebrow text-[10px]">Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Airbus A320neo or Boeing 737 MAX"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="aero-eyebrow text-[10px]">Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Airbus Industrie or Boeing"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink placeholder-ash focus:border-ink focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-pebble">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-ash hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="pill-btn pill-btn-primary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Aircraft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
