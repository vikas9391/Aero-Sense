import React, { useEffect, useState } from 'react';
import { aircraftApi, componentsApi } from '../services/api';
import { Aircraft, Component, VerificationLog } from '../types';
import { Link } from 'react-router-dom';
import {
  Plane,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ScanLine,
  ArrowUpRight,
  Activity,
  Lock,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [componentsList, setComponentsList] = useState<Component[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [a, c] = await Promise.all([
          aircraftApi.list(),
          componentsApi.list(),
        ]);
        setAircraftList(a);
        setComponentsList(c);

        // Fetch verification history for first component if available
        if (c.length > 0) {
          const v = await componentsApi.getVerifications(c[0].id);
          setVerifications(v);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAircraft = aircraftList.length;
  const totalComponents = componentsList.length;
  const verifiedComponents = componentsList.filter((c) => c.status === 'OPERATIONAL').length;
  const tamperedComponents = componentsList.filter((c) => c.status === 'TAMPERED').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Maintenance Dashboard</h1>
        </div>
        <Link
          to="/verify"
          className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-600 transition"
        >
          <ScanLine className="h-4 w-4" />
          <span>Tap / Scan NFC Tag</span>
        </Link>
      </div>

      {/* Security Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Aircraft</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600">
              <Plane className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalAircraft}</span>
            <span className="text-xs text-indigo-600 font-medium">Registered fleet</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">Active commercial models</div>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Components Tracked</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-500">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalComponents}</span>
            <span className="text-xs text-indigo-500 font-medium">NFC identities bound</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">Engines, Avionics, Hydraulics</div>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Authentic</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600">{loading ? '...' : verifiedComponents}</span>
            <span className="text-xs text-emerald-600 font-medium">100% Intact</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">Tamper & hash integrity verified</div>
        </div>

        {/* Card 4 */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Alerts</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600">{loading ? '...' : tamperedComponents}</span>
            <span className="text-xs text-slate-500 font-medium">Tamper events</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">Requires immediate inspection</div>
        </div>
      </div>

      {/* Main Grid: Aircraft & Components Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Aircraft Fleet */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Plane className="h-5 w-5 text-indigo-600" />
                <span>Registered Aircraft Fleet</span>
              </h2>
              <Link to="/aircraft" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium flex items-center space-x-1">
                <span>View All Fleet</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-200/80">
              {aircraftList.map((ac) => (
                <div key={ac.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 text-indigo-600 font-bold text-xs">
                      AC
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{ac.registration_number}</div>
                      <div className="text-xs text-slate-500">{ac.model} • {ac.manufacturer}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="rounded-full bg-emerald-50/60 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200/40">
                      {ac.status}
                    </span>
                    <Link
                      to={`/aircraft/${ac.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/60 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Audit Stream */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <span>Recent NFC Verification Logs</span>
              </h2>
              <Link to="/security" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium flex items-center space-x-1">
                <span>Security Audit Trail</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {verifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                <ScanLine className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                No verification scans executed yet today. Tap "Verify Component" to initiate an NFC scan simulation.
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white/40 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${v.final_result === 'AUTHENTIC' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <div className="font-semibold text-slate-800">Result: {v.final_result}</div>
                        <div className="text-[11px] text-slate-500">{v.created_at}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">{v.failure_reason || 'All 4 verification checks passed'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Component Status */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-indigo-600" />
                <span>Bound Components</span>
              </h2>
              <Link to="/components" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                Catalog
              </Link>
            </div>

            <div className="space-y-3">
              {componentsList.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-white/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800">{c.component_uuid}</span>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-200/60">
                      SN: {c.serial_number}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{c.component_type}</div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">{c.manufacturer}</span>
                    <span className="text-emerald-600 font-medium flex items-center space-x-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{c.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
