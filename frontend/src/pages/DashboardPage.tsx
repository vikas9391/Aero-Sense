import React, { useEffect, useState } from 'react';
import { aircraftApi, componentsApi } from '../services/api';
import { Aircraft, Component, VerificationLog } from '../types';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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
  const { showToast } = useToast();

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
        showToast('Couldn\'t load dashboard data. Please refresh the page.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAircraft = aircraftList.length;
  const totalComponents = componentsList.length;
  const verifiedComponents = componentsList.filter((c) => c.status === 'OPERATIONAL').length;
  const tamperedComponents = componentsList.filter((c) => c.status === 'TAMPERED').length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Security & Maintenance Dashboard"
        action={
          <Button to="/verify">
            <ScanLine className="h-4 w-4" />
            <span>Tap / Scan NFC Tag</span>
          </Button>
        }
      />

      {/* Metric tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Aircraft"
          icon={Plane}
          tone="info"
          value={loading ? '—' : totalAircraft}
          helper="Registered fleet · active commercial models"
        />
        <StatCard
          label="Components Tracked"
          icon={Cpu}
          tone="info"
          value={loading ? '—' : totalComponents}
          helper="NFC identities bound across the fleet"
        />
        <StatCard
          label="Verified Authentic"
          icon={CheckCircle2}
          tone="verified"
          value={loading ? '—' : verifiedComponents}
          helper="Tamper & hash integrity verified"
        />
        <StatCard
          label="Security Alerts"
          icon={AlertTriangle}
          tone="critical"
          value={loading ? '—' : tamperedComponents}
          helper="Tamper events — requires inspection"
        />
      </div>

      {/* Main grid: aircraft & components overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Registered Aircraft Fleet"
              icon={Plane}
              action={
                <Link to="/aircraft" className="flex items-center gap-1 text-xs font-medium text-ink hover:text-ash">
                  <span>View All Fleet</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />

            <div className="divide-y divide-pebble">
              {aircraftList.map((ac) => (
                <div key={ac.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-pebble bg-white aero-mono text-[11px] font-semibold text-ink">
                      AC
                    </div>
                    <div>
                      <div className="font-semibold text-ink text-sm aero-mono">{ac.registration_number}</div>
                      <div className="text-xs text-ash">{ac.model} • {ac.manufacturer}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="verified">{ac.status}</Badge>
                    <Link
                      to={`/aircraft/${ac.id}`}
                      className="rounded-lg border border-pebble px-3 py-1.5 text-xs text-ink hover:bg-[#f7f7f5] transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader
              title="Recent NFC Verification Logs"
              icon={Activity}
              action={
                <Link to="/security" className="flex items-center gap-1 text-xs font-medium text-ink hover:text-ash">
                  <span>Security Audit Trail</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />

            {verifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-pebble p-8 text-center text-xs text-ash">
                <ScanLine className="h-8 w-8 text-ash mx-auto mb-2" />
                No verification scans executed yet today. Tap "Verify Component" to initiate an NFC scan simulation.
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-pebble bg-white text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${v.final_result === 'AUTHENTIC' ? 'bg-[#0a7a4c]' : 'bg-[#b13a2f]'}`} />
                      <div>
                        <div className="font-semibold text-ink">Result: {v.final_result}</div>
                        <div className="aero-mono text-[11px] text-ash">{v.created_at}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-ash">{v.failure_reason || 'All 4 verification checks passed'}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: quick component status */}
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Bound Components"
              icon={Cpu}
              action={
                <Link to="/components" className="text-xs font-medium text-ink hover:text-ash">
                  Catalog
                </Link>
              }
            />

            <div className="space-y-3">
              {componentsList.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-pebble bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-ink aero-mono">{c.component_uuid}</span>
                    <span className="rounded border border-pebble bg-[#f7f7f5] px-2 py-0.5 text-[10px] font-semibold text-ink aero-mono">
                      SN: {c.serial_number}
                    </span>
                  </div>
                  <div className="text-xs text-ash">{c.component_type}</div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-ash">{c.manufacturer}</span>
                    <span className="text-[#0a7a4c] font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{c.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold text-ink">
              <Lock className="h-4 w-4 text-ash" />
              <span>Identity & Security Architecture</span>
            </h3>
            <ul className="text-xs text-ash space-y-2 list-disc list-inside leading-relaxed">
              <li>Hardware UID mapped to Component UUID</li>
              <li>AES-128 SUN dynamic CMAC verification</li>
              <li>TagTamper physical seal integrity check</li>
              <li>SHA-256 on-chain maintenance record proof</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
