import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, PackageCheck, ClipboardCheck, Wrench, ShieldCheck } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface LedgerEntry {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  event: string;
  detail: string;
  timestamp: string;
  recordId: string;
  hash: string;
}

// Illustrates the same shape as the real record: MaintenanceRecord
// already carries `record_hash` and `created_at` on every row today,
// and VerificationLog is append-only in the same way. This is a
// human-readable narrative built on that real shape — not a live feed
// — same "example values" convention as DigitalTwinSection and
// ComponentPassport.
const LEDGER: LedgerEntry[] = [
  {
    id: 'identity',
    icon: Fingerprint,
    event: 'Digital identity created',
    detail: 'Component AS-ENG-2048 registered with a base identity record.',
    timestamp: '14 Mar 2026, 09:12 UTC',
    recordId: 'REC-000482',
    hash: '0x8f3a…c119',
  },
  {
    id: 'installed',
    icon: PackageCheck,
    event: 'Component installed',
    detail: 'Fitted to aircraft N2048AS and linked to its digital twin.',
    timestamp: '02 Apr 2026, 14:47 UTC',
    recordId: 'REC-000513',
    hash: '0x2e91…4b7d',
  },
  {
    id: 'inspection',
    icon: ClipboardCheck,
    event: 'Inspection completed',
    detail: 'Passed — no findings against the component\u2019s conformity record.',
    timestamp: '12 Jun 2026, 08:03 UTC',
    recordId: 'REC-000871',
    hash: '0x71cd…a3f0',
  },
  {
    id: 'maintenance',
    icon: Wrench,
    event: 'Maintenance logged',
    detail: 'Turbine blade assembly replaced and recorded against its history.',
    timestamp: '30 Jul 2026, 16:25 UTC',
    recordId: 'REC-001042',
    hash: '0x9b4e…d820',
  },
  {
    id: 'verification',
    icon: ShieldCheck,
    event: 'Verification performed',
    detail: 'Authentic — identity and blockchain integrity both confirmed.',
    timestamp: '12 Aug 2026, 11:58 UTC',
    recordId: 'REC-001199',
    hash: '0xc60a…77e5',
  },
];

const listReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const rowReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const BlockchainHistory: React.FC = () => {
  return (
    <section id="blockchain-history" className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl"
        >
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-ash">
            Blockchain History
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            A history that cannot
            <br />
            be quietly changed.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            Every identity, inspection, maintenance action and verification is appended to a
            component's permanent record — readable as a story, backed by a technical
            reference underneath.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={listReveal}
          className="mt-16 border-t border-pebble"
        >
          {LEDGER.map((entry) => {
            const Icon = entry.icon;
            return (
              <motion.div
                key={entry.id}
                variants={rowReveal}
                className="flex flex-col gap-4 border-b border-pebble py-7 md:flex-row md:items-center md:gap-8"
              >
                <div className="flex items-start gap-4 md:w-[340px] md:shrink-0">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-pebble text-ink">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-semibold text-ink">
                      {entry.event}
                    </div>
                    <p className="mt-1 font-body text-sm leading-relaxed text-ash">
                      {entry.detail}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 font-body text-xs sm:grid-cols-3 md:flex-1">
                  <div>
                    <div className="uppercase tracking-[0.12em] text-ash/70">Timestamp</div>
                    <div className="mt-1 font-mono text-[13px] text-ink/80">
                      {entry.timestamp}
                    </div>
                  </div>
                  <div>
                    <div className="uppercase tracking-[0.12em] text-ash/70">Record ID</div>
                    <div className="mt-1 font-mono text-[13px] text-ink/80">{entry.recordId}</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-[0.12em] text-ash/70">Hash</div>
                    <div className="mt-1 font-mono text-[13px] text-ink/80">{entry.hash}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-4 font-body text-xs text-ash">
          Example ledger shown for illustration, modeled on real maintenance and verification
          records. Sign in to view a component's actual history.
        </p>
      </div>
    </section>
  );
};

export default BlockchainHistory;
