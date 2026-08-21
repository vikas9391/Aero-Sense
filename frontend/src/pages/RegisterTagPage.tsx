import React, { useEffect, useState } from 'react';
import { componentsApi, tagsApi } from '../services/api';
import { Component } from '../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ScanLine, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

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
  const { showToast } = useToast();

  useEffect(() => {
    componentsApi.list().then(setComponents).catch((err) => {
      console.error(err);
      showToast('Couldn\'t load the component list for this form.', 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <PageHeader eyebrow="Identity Binding" title="Register & Bind NFC / RFID Tag" />

      <Card className="p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-[#fbeceb]/60 p-4 text-sm text-[#b13a2f] border border-[#f0cbc7]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-xl bg-[#e9f6ef]/60 p-4 text-sm text-[#0a7a4c] border border-[#c9e8d7]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="aero-eyebrow text-[10px]">Target Aircraft Component</label>
            <select
              required
              value={componentId}
              onChange={(e) => setComponentId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
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
              <label className="aero-eyebrow text-[10px]">Hardware Technology</label>
              <select
                value={technology}
                onChange={(e) => setTechnology(e.target.value as 'NFC' | 'UHF_RFID')}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="NFC">Secure NFC (13.56 MHz HF)</option>
                <option value="UHF_RFID">UHF RFID (860-960 MHz RAIN)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="aero-eyebrow text-[10px]">Security Type</label>
              <select
                value={securityType}
                onChange={(e) => setSecurityType(e.target.value)}
                className="w-full rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              >
                <option value="MOCK">Mock Hardware</option>
                <option value="BASIC_UID">Basic Factory UID</option>
                <option value="SECURE_NTAG424">NXP NTAG 424 DNA (AES-128 SUN)</option>
              </select>
            </div>
          </div>

          {/* NFC tap simulation action */}
          <div className="p-5 rounded-xl border border-pebble bg-[#f7f7f5] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-semibold text-sm text-ink">Simulate Physical Tag Scan / Tap</div>
                <div className="text-xs text-ash">Reads physical hardware UID or simulates tap event.</div>
              </div>
              <button
                type="button"
                onClick={simulateTap}
                className="flex items-center gap-2 rounded-xl border border-pebble bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-[#f1f1ef] transition"
              >
                <ScanLine className="h-4 w-4" />
                <span>TAP NFC TAG</span>
              </button>
            </div>

            <div>
              <label className="aero-eyebrow text-[10px]">Captured Tag Identifier / UID</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full mt-1 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm text-ink aero-mono font-semibold focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-pebble flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="pill-btn pill-btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? 'Binding...' : 'Register & Bind Tag'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
