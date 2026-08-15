import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

// Diagram entrance — stagger parent for the connecting line and the
// three nodes below. Purely a visual restatement of the paragraph text
// already in the card (Physical Component -> NFC -> Digital Identity),
// so it's safe to mark aria-hidden.
const diagramReveal = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
};

const lineReveal = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: EASE },
  },
};

const nodeReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

const DIAGRAM_NODES = [
  { cx: 60, label: 'Physical Component' },
  { cx: 360, label: 'NFC' },
  { cx: 660, label: 'Digital Identity' },
] as const;

export const SolutionFeature: React.FC = () => {
  return (
    <section id="solution" className="bg-white px-6 pb-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-1 items-center gap-10 bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-14 md:grid-cols-2 md:px-16 md:py-20"
        >
          <div>
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              AERO-SENSE Platform
            </span>
            <h2 className="mt-5 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-[3rem]">
              Digital component identity.
            </h2>
          </div>
          <p className="font-body text-lg leading-relaxed text-white/85">
            AERO-SENSE connects an aviation component with a secure digital identity and
            trusted lifecycle information, creating a stronger foundation for authentication
            and traceability.
          </p>

          {/* Minimal diagram: Physical Component -> NFC -> Digital Identity.
              Decorative restatement of the paragraph above; the flow it
              shows is already conveyed in text, so it's aria-hidden. */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={diagramReveal}
            className="md:col-span-2"
          >
            <svg
              viewBox="0 0 720 100"
              className="mx-auto w-full max-w-2xl"
              aria-hidden="true"
              role="presentation"
            >
              <motion.line
                x1={DIAGRAM_NODES[0].cx}
                y1="42"
                x2={DIAGRAM_NODES[2].cx}
                y2="42"
                stroke="white"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                variants={lineReveal}
              />
              {DIAGRAM_NODES.map((node) => (
                <motion.g key={node.label} variants={nodeReveal}>
                  <circle cx={node.cx} cy="42" r="6" fill="white" />
                  <text
                    x={node.cx}
                    y="78"
                    textAnchor="middle"
                    fill="white"
                    fillOpacity="0.75"
                    style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
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