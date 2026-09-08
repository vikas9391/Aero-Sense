import React, { useEffect, useState } from 'react';
import { aircraftApi, componentsApi } from '../services/api';
import { Aircraft, Component, VerificationLog } from '../types';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plane, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, ScanLine, ArrowUpRight, Activity, Lock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [componentsList, setComponentsList] = useState<Component[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canVerify = role === 'COMPANY_ADMIN' || role === 'MANUFACTURER' || role === 'MAINTENANCE_TECHNICIAN' || role === 'INSPECTOR';
  const canAudit = role === 'COMPANY_ADMIN' || role === 'INSPECTOR';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [a, c] = await Promise.all([aircraftApi.list(), componentsApi.list()]);
        setAircraftList(a);
        setComponentsList(c);
        if (canVerify && c.length > 0) {
          const v = await componentsApi.getVerifications(c[0].id);
          setVerifications(v);
        } else {
          setVerifications([]);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        showToast("Couldn't load dashboard data. Please refresh the page.", 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canVerify, showToast]);

  const totalAircraft = aircraftList.length;
  const totalComponents = componentsList.length;
  const verifiedComponents = componentsList.filter((c) => c.status === 'OPERATIONAL').length;
  const tamperedComponents = componentsList.filter((c) => c.status === 'TAMPERED').length;

  return (
    <div className="min-w-0 space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Security & Maintenance Dashboard"
        action={canVerify ? <Button to="/verify"><ScanLine className="h-4 w-4" /><span>Tap / Scan NFC Tag</span></Button> : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Aircraft" icon={Plane} tone="info" value={loading ? '—' : totalAircraft} helper="Registered fleet · active commercial models" />
        <StatCard label="Components Tracked" icon={Cpu} tone="info" value={loading ? '—' : totalComponents} helper="NFC identities bound across the fleet" />
        <StatCard label="Verified Authentic" icon={CheckCircle2} tone="verified" value={loading ? '—' : verifiedComponents} helper="Tamper & hash integrity verified" />
        <StatCard label="Security Alerts" icon={AlertTriangle} tone="critical" value={loading ? '—' : tamperedComponents} helper="Tamper events — requires inspection" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <div className="lg:col-span-2 min-w-0 space-y-6">
          <Card className="p-4 sm:p-6 min-w-0">
            <CardHeader
              title="Registered Aircraft Fleet"
              icon={Plane}
              action={<Link to="/aircraft" className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink hover:text-ash"><span>View All Fleet</span><ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            />
            <div className="divide-y divide-pebble">
              {aircraftList.length === 0 && !loading ? <div className="py-10 text-center text-xs text-ash">No aircraft registered yet.</div> : aircraftList.map((ac) => (
                <div key={ac.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-pebble bg-white aero-mono text-[11px] font-semibold text-ink">AC</div>
                    <div className="min-w-0"><div className="font-semibold text-ink text-sm aero-mono truncate" title={ac.registration_number}>{ac.registration_number}</div><div className="text-xs text-ash truncate" title={`${ac.model} • ${ac.manufacturer}`}>{ac.model} • {ac.manufacturer}</div></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3"><Badge tone="verified">{ac.status}</Badge><Link to={`/aircraft/${ac.id}`} className="rounded-lg border border-pebble px-3 py-1.5 text-xs text-ink hover:bg-[#f7f7f5] transition whitespace-nowrap">View Details</Link></div>
                </div>
              ))}
            </div>
          </Card>

          {canVerify && (
            <Card className="p-4 sm:p-6 min-w-0">
              <CardHeader
                title="Recent NFC Verification Logs"
                icon={Activity}
                action={canAudit ? <Link to="/security" className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink hover:text-ash"><span>Security Audit Trail</span><ArrowUpRight className="h-3.5 w-3.5" /></Link> : undefined}
              />
              {verifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-pebble p-6 sm:p-8 text-center text-xs text-ash"><ScanLine className="h-8 w-8 text-ash mx-auto mb-2" />No verification scans executed yet today. Tap "Verify Component" to initiate an NFC scan.</div>
              ) : (
                <div className="space-y-3">
                  {verifications.map((v) => (
                    <div key={v.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-pebble bg-white text-xs min-w-0">
                      <div className="flex min-w-0 items-center gap-3"><div className={`h-2.5 w-2.5 shrink-0 rounded-full ${v.final_result === 'AUTHENTIC' ? 'bg-[#0a7a4c]' : 'bg-[#b13a2f]'}`} /><div className="min-w-0"><div className="font-semibold text-ink truncate">Result: {v.final_result}</div><div className="aero-mono text-[11px] text-ash truncate" title={v.created_at}>{v.created_at}</div></div></div>
                      <span className="max-w-full sm:max-w-[55%] text-[11px] text-ash break-words sm:text-right">{v.failure_reason || 'All 4 verification checks passed'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="p-4 sm:p-6 min-w-0">
            <CardHeader title="Bound Components" icon={Cpu} action={<Link to="/components" className="text-xs font-medium text-ink hover:text-ash">Catalog</Link>} />
            <div className="space-y-3">
              {componentsList.length === 0 && !loading ? <div className="py-8 text-center text-xs text-ash">No components bound yet.</div> : componentsList.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-pebble bg-white space-y-2 min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-2"><span className="min-w-0 truncate font-semibold text-sm text-ink aero-mono" title={c.component_uuid}>{c.component_uuid}</span><span className="shrink-0 max-w-[48%] truncate rounded border border-pebble bg-[#f7f7f5] px-2 py-0.5 text-[10px] font-semibold text-ink aero-mono" title={`SN: ${c.serial_number}`}>SN: {c.serial_number}</span></div>
                  <div className="text-xs text-ash truncate" title={c.component_type}>{c.component_type}</div>
                  <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] pt-1"><span className="min-w-0 truncate text-ash" title={c.manufacturer}>{c.manufacturer}</span><span className="shrink-0 text-[#0a7a4c] font-medium flex items-center gap-1"><ShieldCheck className="h-3 w-3" /><span>{c.status}</span></span></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold text-ink"><Lock className="h-4 w-4 shrink-0 text-ash" /><span>Identity & Security Architecture</span></h3>
            <ul className="text-xs text-ash space-y-2 list-disc list-inside leading-relaxed"><li>Hardware UID mapped to Component UUID</li><li>AES-128 SUN dynamic CMAC verification</li><li>TagTamper physical seal integrity check</li><li>SHA-256 on-chain maintenance record proof</li></ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
