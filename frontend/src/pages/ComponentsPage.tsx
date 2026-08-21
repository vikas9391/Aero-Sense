import React, { useEffect, useState } from 'react';
import { componentsApi } from '../services/api';
import { Component } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Search, ShieldCheck, ArrowRight, Plane, Tag } from 'lucide-react';
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

  const filtered = components.filter(
    (c) =>
      c.component_uuid.toLowerCase().includes(search.toLowerCase()) ||
      c.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      c.component_type.toLowerCase().includes(search.toLowerCase()) ||
      c.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Component Registry"
        title="Aircraft Component Catalog"
        action={
          canRegister ? (
            <div className="flex items-center gap-3">
              <Link
                to="/nfc/register"
                className="inline-flex items-center gap-2 rounded-xl border border-pebble bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-[#f7f7f5] transition"
              >
                <Tag className="h-4 w-4" />
                <span>Bind NFC / RFID Tag</span>
              </Link>
              <Button to="/components/register">
                <Plus className="h-4 w-4" />
                <span>Register Component</span>
              </Button>
            </div>
          ) : undefined
        }
      />
      <p className="-mt-4 text-sm text-ash">
        Registered physical components with digital NFC cryptographic identity mapping.
      </p>

      {/* Search filter bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-ash" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Component ID, Serial #, Type, or Manufacturer..."
          className="w-full rounded-xl border border-pebble bg-white pl-10 pr-4 py-2 text-xs text-ink placeholder-ash focus:border-ink focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-ash text-sm">Loading catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card key={c.id} className="p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base text-ink aero-mono">{c.component_uuid}</span>
                  <span className="rounded border border-pebble bg-[#f7f7f5] px-2.5 py-1 text-xs font-semibold text-ink aero-mono">
                    SN: {c.serial_number}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-ink text-sm">{c.component_type}</h3>
                  <div className="text-xs text-ash mt-0.5">{c.manufacturer}</div>
                </div>

                <div className="flex items-center gap-2 text-xs text-ash pt-2 border-t border-pebble">
                  <Plane className="h-3.5 w-3.5 text-ash" />
                  <span>Aircraft: <strong className="text-ink">{c.aircraft_registration || 'Unassigned'}</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-pebble flex items-center justify-between">
                <span className="text-[#0a7a4c] text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{c.status}</span>
                </span>
                <Link
                  to={`/components/${c.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-ink hover:text-ash"
                >
                  <span>Component Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
