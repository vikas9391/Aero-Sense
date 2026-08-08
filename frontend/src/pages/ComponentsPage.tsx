import React, { useEffect, useState } from 'react';
import { componentsApi } from '../services/api';
import { Component } from '../types';
import { Link } from 'react-router-dom';
import { Cpu, Plus, Search, ShieldCheck, ArrowRight, Plane } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ComponentsPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const canRegister = user?.role === 'ADMIN' || user?.role === 'MANUFACTURER';

  useEffect(() => {
    componentsApi.list()
      .then(setComponents)
      .catch(console.error)
      .finally(() => setLoading(false));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-3">
            <Cpu className="h-7 w-7 text-sky-400" />
            <span>Aircraft Component Catalog</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered physical components with digital NFC cryptographic identity mapping.
          </p>
        </div>

        {canRegister && (
          <Link
            to="/components/register"
            className="inline-flex items-center space-x-2 rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Register Component</span>
          </Link>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Component ID, Serial #, Type, or Manufacturer..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base text-sky-400">{c.component_uuid}</span>
                  <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300 border border-slate-700">
                    SN: {c.serial_number}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{c.component_type}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{c.manufacturer}</div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <Plane className="h-3.5 w-3.5 text-slate-500" />
                  <span>Aircraft: <strong className="text-slate-200">{c.aircraft_registration || 'Unassigned'}</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{c.status}</span>
                </span>
                <Link
                  to={`/components/${c.id}`}
                  className="flex items-center space-x-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  <span>Component Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
