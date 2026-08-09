import React, { useEffect, useState } from 'react';
import { componentsApi, tagsApi } from '../services/api';
import { Component } from '../types';
import { useNavigate } from 'react-router-dom';
import { Tag, ScanLine, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterTagPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [componentId, setComponentId] = useState<number | ''>('');
  const [technology, setTechnology] = useState<'NFC' | 'UHF_RFID'>('NFC');
  const [identifier, setIdentifier] = useState('04:A3:91:XX');
  const [securityType, setSecurityType] = useState('MOCK');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    componentsApi.list().then(setComponents).catch(console.error);
  }, []);

  const simulateTap = () => {
    // Generate simulated tag UID
    const hex = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    ).join(':');
    setIdentifier(`04:${hex}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentId) {
      setError('Please select a component to bind this tag to.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await tagsApi.register({
        component_id: Number(componentId),
        technology,
        identifier,
        security_type: securityType,
      });
      setSuccess(`Tag ${identifier} successfully bound to Component #${componentId}`);
      setTimeout(() => navigate(`/components/${componentId}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to bind tag identity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-3">
          <Tag className="h-7 w-7 text-blue-600" />
          <span>Register & Bind NFC / RFID Tag</span>
        </h1>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-200 space-y-6">
        {error && (
          <div className="flex items-center space-x-3 rounded-xl bg-rose-50/50 p-4 text-sm text-rose-600 border border-rose-200/60">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center space-x-3 rounded-xl bg-emerald-50/50 p-4 text-sm text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Aircraft Component</label>
            <select
              required
              value={componentId}
              onChange={(e) => setComponentId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Select Target Component --</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.component_uuid} — {c.component_type} (SN: {c.serial_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hardware Technology</label>
              <select
                value={technology}
                onChange={(e) => setTechnology(e.target.value as 'NFC' | 'UHF_RFID')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="NFC">Secure NFC (13.56 MHz HF)</option>
                <option value="UHF_RFID">UHF RFID (860-960 MHz RAIN)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Type</label>
              <select
                value={securityType}
                onChange={(e) => setSecurityType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="MOCK">Mock Hardware</option>
                <option value="BASIC_UID">Basic Factory UID</option>
                <option value="SECURE_NTAG424">NXP NTAG 424 DNA (AES-128 SUN)</option>
              </select>
            </div>
          </div>

          {/* NFC Tap Simulation Action */}
          <div className="p-5 rounded-xl border border-blue-200/40 bg-blue-50/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-800">Simulate Physical Tag Scan / Tap</div>
                <div className="text-xs text-slate-500">Reads physical hardware UID or simulates tap event.</div>
              </div>
              <button
                type="button"
                onClick={simulateTap}
                className="flex items-center space-x-2 rounded-xl bg-blue-600/20 border border-blue-500/40 px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-600/30 transition"
              >
                <ScanLine className="h-4 w-4" />
                <span>TAP NFC TAG</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Captured Tag Identifier / UID</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-blue-600 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Binding...' : 'Register & Bind Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
