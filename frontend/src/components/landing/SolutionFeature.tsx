import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const diagramReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.25, delayChildren: 0.1 } },
};

const lineReveal = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: EASE } },
};

const nodeReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const DIAGRAM_NODES = [
  { cx: 60, label: 'Component' },
  { cx: 360, label: 'NFC' },
  { cx: 660, label: 'Digital Identity' },
] as const;

export const SolutionFeature: React.FC = () => {
  return (
    <section id="solution" className="bg-[var(--color-sky)] px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden rounded-[28px] border border-indigo-100 bg-white/85 px-7 py-12 shadow-[0_24px_70px_rgba(79,70,229,.10)] backdrop-blur-xl md:rounded-[34px] md:px-14 md:py-16"
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14">
            <div>
              <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                AERO-SENSE Platform
              </span>
              <h2 className="mt-5 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3rem]">
                Digital component identity.
              </h2>
            </div>
            <p className="font-body text-lg leading-relaxed text-ash">
              Connect an aviation component to a secure digital identity and its trusted lifecycle record.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={diagramReveal}
            className="mt-12 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-blue-50/70 to-violet-50/80 px-4 py-8 md:mt-14 md:px-10"
          >
            <svg viewBox="0 0 720 100" className="mx-auto w-full max-w-2xl" aria-hidden="true" role="presentation">
              <defs>
                <linearGradient id="solution-flow" x1="0" x2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <motion.line
                x1={DIAGRAM_NODES[0].cx}
                y1="42"
                x2={DIAGRAM_NODES[2].cx}
                y2="42"
                stroke="url(#solution-flow)"
                strokeOpacity="0.55"
                strokeWidth="2"
                variants={lineReveal}
              />
              {DIAGRAM_NODES.map((node, i) => (
                <motion.g key={node.label} variants={nodeReveal}>
                  <circle cx={node.cx} cy="42" r="9" fill="white" stroke={i === 1 ? '#2563eb' : '#6366f1'} strokeWidth="2.5" />
                  <circle cx={node.cx} cy="42" r="3" fill={i === 1 ? '#2563eb' : '#7c3aed'} />
                  <text
                    x={node.cx}
                    y="78"
                    textAnchor="middle"
                    fill="#667085"
                    style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  >
                    {node.label}
                  </text>
                </motion.g>
              ))}
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionFeature;
