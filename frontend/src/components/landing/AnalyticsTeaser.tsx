import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

// Mirrors the shape of the real internal Analytics page (WorkAnalytics:
// verifications_passed/failed, component/aircraft counts) rather than
// inventing a different data model — this is a public preview of that
// same page's story, not a separate feature. Example values only, same
// "illustration, not a live feed" convention used elsewhere on the
// landing page.
const VERIFICATIONS_PASSED = 2412;
const VERIFICATIONS_FAILED = 19;
const TOTAL_VERIFICATIONS = VERIFICATIONS_PASSED + VERIFICATIONS_FAILED;
const PASS_RATE = (VERIFICATIONS_PASSED / TOTAL_VERIFICATIONS) * 100;

const COMPONENT_STATUS = [
  { label: 'Verified', value: 2847, className: 'bg-emerald-600' },
  { label: 'Maintenance Due', value: 34, className: 'bg-amber-500' },
  { label: 'Critical', value: 3, className: 'bg-red-600' },
];
const COMPONENT_TOTAL = COMPONENT_STATUS.reduce((sum, s) => sum + s.value, 0);

// Relative bar heights for a 7-day verification activity snapshot —
// unitless, purely illustrative of shape/trend, not counts.
const WEEKLY_ACTIVITY = [0.4, 0.55, 0.5, 0.7, 0.62, 0.85, 1] as const;
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export const AnalyticsTeaser: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="analytics" className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-16 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-ash">
            Analytics
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            Intelligence across
            <br />
            your entire fleet.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            Verification activity, maintenance trends and component health, brought together
            in one view — the same analytics your team sees inside the platform.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="pill-btn pill-btn-ghost mt-8"
          >
            Explore Analytics
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="border border-pebble p-8 md:p-10"
        >
          {/* Verification outcomes */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
                Verification Outcomes
              </h3>
              <span className="font-mono text-sm text-ink/80">{PASS_RATE.toFixed(1)}%</span>
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-body text-sm text-ink">
                  {VERIFICATIONS_PASSED.toLocaleString()} authentic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-body text-sm text-ink">
                  {VERIFICATIONS_FAILED} flagged
                </span>
              </div>
            </div>
            <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-[#f1f1ef]">
              <motion.div
                className="h-full bg-emerald-600"
                initial={{ width: 0 }}
                whileInView={{ width: `${PASS_RATE}%` }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.9, ease: EASE }}
              />
              <motion.div
                className="h-full bg-red-600"
                initial={{ width: 0 }}
                whileInView={{ width: `${100 - PASS_RATE}%` }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
              />
            </div>
          </div>

          {/* Component status breakdown */}
          <div className="mt-8 border-t border-pebble pt-8">
            <h3 className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
              Component Status
            </h3>
            <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-[#f1f1ef]">
              {COMPONENT_STATUS.map((status) => (
                <motion.div
                  key={status.label}
                  className={`h-full ${status.className}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(status.value / COMPONENT_TOTAL) * 100}%` }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {COMPONENT_STATUS.map((status) => (
                <div key={status.label} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${status.className}`} />
                  <span className="font-body text-xs text-ash">
                    {status.value.toLocaleString()} {status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly verification activity */}
          <div className="mt-8 border-t border-pebble pt-8">
            <h3 className="font-body text-[11px] uppercase tracking-[0.15em] text-ash">
              Verification Activity
            </h3>
            <div className="mt-5 flex h-24 items-end gap-2.5">
              {WEEKLY_ACTIVITY.map((height, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full items-end">
                    <motion.div
                      className="w-full rounded-t-sm bg-ink/80"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height * 100}%` }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }}
                    />
                  </div>
                  <span className="font-body text-[10px] uppercase text-ash/70">
                    {WEEKDAY_LABELS[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <p className="mx-auto mt-8 max-w-[1400px] font-body text-xs text-ash">
        Example analytics shown for illustration. Sign in to view your organization's actual
        fleet analytics.
      </p>
    </section>
  );
};

export default AnalyticsTeaser;
