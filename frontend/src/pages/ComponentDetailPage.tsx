import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { componentsApi } from '../services/api';
import { Component, MaintenanceRecord, VerificationLog } from '../types';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Cpu, ArrowLeft, Tag, Wrench, Lock, ExternalLink, Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const ComponentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<Component | null>(null);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      const cid = parseInt(id, 10);
      Promise.all([
        componentsApi.getById(cid),
        componentsApi.getHistory(cid),
        componentsApi.getVerifications(cid),
      ])
        .then(([c, h, v]) => {
          setComponent(c);
          setHistory(h);
          setVerifications(v);
        })
        .catch((err) => {
          console.error(err);
          showToast('Couldn\'t load this component\'s record.', 'error');
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="py-12 text-center text-ash text-sm">Loading component record...</div>;
  if (!component) return <div className="py-12 text-center text-[#b13a2f] text-sm">Component not found.</div>;

  return (
    <div className="space-y-6">
      <Link to="/components" className="inline-flex items-center gap-2 text-xs font-semibold text-ink hover:text-ash">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Component Catalog</span>
      </Link>

      {/* Digital passport header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
              <Cpu className="h-7 w-7" />
            </div>
            <div>
              <div className="aero-eyebrow mb-1">Component Digital Passport</div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-ink aero-mono">{component.component_uuid}</h1>
                <span className="rounded border border-pebble bg-[#f7f7f5] px-2.5 py-1 text-xs font-semibold text-ink aero-mono">
                  Serial #{component.serial_number}
                </span>
              </div>
              <p className="text-sm text-ash mt-1">{component.component_type} • Manufactured by {component.manufacturer}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-pebble pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="aero-eyebrow text-[10px]">Assigned Aircraft</div>
              <div className="text-ink font-semibold text-sm aero-mono">
                {component.aircraft_registration || 'Unassigned'}
              </div>
            </div>
            <Badge tone="verified">{component.status}</Badge>
          </div>
        </div>
      </Card>

      {/* Maintenance history & verification audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Digital Maintenance History"
              icon={Wrench}
              action={
                <Link to="/maintenance" className="text-xs font-semibold text-ink hover:text-ash">
                  + Log Record
                </Link>
              }
            />

            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-pebble p-8 text-center text-xs text-ash">
                No maintenance records logged for this component yet.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((h) => (
                  <div key={h.id} className="p-4 rounded-xl border border-pebble bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink text-sm">{h.maintenance_type}</span>
                      <Badge tone={h.inspection_result === 'PASSED' ? 'verified' : h.inspection_result === 'WARNING' ? 'warning' : 'critical'}>
                        {h.inspection_result}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#3a3a40] leading-relaxed">{h.description}</p>
                    {h.parts_replaced && (
                      <div className="text-xs text-ash">
                        <strong className="text-ink">Parts Replaced:</strong> {h.parts_replaced}
                      </div>
                    )}

                    <div className="pt-2 border-t border-pebble flex flex-wrap items-center justify-between text-[11px] text-ash gap-2">
                      <span>Tech: <strong className="text-ink">{h.technician_name}</strong> • {h.created_at}</span>
                      <div className="flex items-center gap-1 aero-mono text-ink bg-[#f7f7f5] px-2 py-0.5 rounded border border-pebble">
                        <Lock className="h-3 w-3" />
                        <span>SHA-256: {h.record_hash.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* NFC identity + verification history */}
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader title="NFC Hardware Identity" icon={Tag} />

            <div className="p-4 rounded-xl border border-pebble bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="aero-eyebrow text-[10px]">Technology</span>
                <span className="text-xs font-semibold text-ink">Secure NFC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="aero-eyebrow text-[10px]">Hardware UID</span>
                <span className="text-xs font-semibold text-ink aero-mono">04:A3:91:XX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="aero-eyebrow text-[10px]">Security Protocol</span>
                <span className="text-xs font-semibold text-ink">AES-128 CMAC SUN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="aero-eyebrow text-[10px]">TagTamper Status</span>
                <span className="text-xs font-semibold text-[#0a7a4c]">INTACT</span>
              </div>
            </div>

            <div className="mt-4">
              <Button to="/verify" className="w-full">
                <span>Run NFC Verification Scan</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <CardHeader title="Verification History" icon={Activity} />

            {verifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-pebble p-6 text-center text-xs text-ash">
                No verification scans logged for this component yet.
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-pebble bg-white">
                    {v.final_result === 'AUTHENTIC' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#0a7a4c] shrink-0 mt-0.5" />
                    ) : v.final_result === 'SUSPICIOUS' ? (
                      <AlertTriangle className="h-4 w-4 text-[#b5790f] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#b13a2f] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink">{v.final_result}</div>
                      <div className="text-[11px] text-ash mt-0.5">
                        {v.failure_reason || 'All 4 checks passed'}
                      </div>
                      <div className="text-[10px] text-ash aero-mono mt-1">{v.created_at}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
