import React, { useEffect, useState } from 'react';
import { aircraftApi } from '../services/api';
import { Aircraft } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plane, Plus, ArrowRight, AlertCircle, Building, CheckCircle2 } from 'lucide-react';

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

  const canAdd = user?.role === 'COMPANY_ADMIN' || user?.role === 'MANUFACTURER';

  const fetchAircraft = async () => {
    try {
      const data = await aircraftApi.list();
      setAircraftList(data);
    } catch (err) {
      console.error('Failed to load aircraft:', err);
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
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
            <Plane className="h-7 w-7 text-indigo-600" />
            <span>Aircraft Fleet Overview</span>
          </h1>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Register Aircraft</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading aircraft fleet...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aircraftList.map((ac) => (
            <div key={ac.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-lg bg-indigo-50/80 px-3 py-1 text-xs font-bold text-indigo-600 border border-indigo-200/60">
                    {ac.registration_number}
                  </span>
                  <span className="flex items-center space-x-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{ac.status}</span>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{ac.model}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  <span>{ac.manufacturer}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">UUID: {ac.aircraft_uuid.substring(0, 8)}...</span>
                <Link
                  to={`/aircraft/${ac.id}`}
                  className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Aircraft */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Register New Aircraft</h2>
            {error && (
              <div className="flex items-center space-x-2 rounded-xl bg-rose-50/50 p-3 text-xs text-rose-600 border border-rose-200/60">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A320-002 or N9824X"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Airbus A320neo or Boeing 737 MAX"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Airbus Industrie or Boeing"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
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
