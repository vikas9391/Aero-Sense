import React from 'react';
import { motion } from 'framer-motion';
import { ComponentHotspots } from './ComponentHotspots';

const EASE = [0.16, 1, 0.3, 1] as const;
const AIRCRAFT_STILL = '/cinematic/aircraft/ezgif-frame-001.jpg';

export const DigitalTwinSection: React.FC = () => {
  return (
    <section id="digital-twin" className="bg-[var(--bg-app)] px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl"
        >
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Aircraft Digital Twin
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            One aircraft. Every component.
            <br />
            One digital identity.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            Explore how AERO-SENSE connects major aircraft systems to their verified digital records.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="relative mt-14 aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-indigo-100 bg-ink shadow-[0_28px_80px_rgba(79,70,229,.12)] md:mt-16 md:rounded-[34px]"
        >
          <img
            src={AIRCRAFT_STILL}
            alt="Aircraft with interactive component identity markers"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-indigo-950/10" />
          <ComponentHotspots />
        </motion.div>
      </div>
    </section>
  );
};

export default DigitalTwinSection;
