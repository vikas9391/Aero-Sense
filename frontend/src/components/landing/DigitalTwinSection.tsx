import React from 'react';
import { motion } from 'framer-motion';
import { ComponentHotspots } from './ComponentHotspots';

const EASE = [0.16, 1, 0.3, 1] as const;

// Reuses the Hero's own first cinematic frame rather than a new asset —
// same aircraft, same photo, already shipped to every visitor as part
// of the Hero's frame sequence at /cinematic/aircraft/. A plain <img>
// here (not the scroll-scrubbed canvas) since this section just needs
// one static, high-quality still to host the hotspots.
const AIRCRAFT_STILL = '/cinematic/aircraft/ezgif-frame-001.jpg';

export const DigitalTwinSection: React.FC = () => {
  return (
    <section id="digital-twin" className="bg-white px-6 py-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl"
        >
          <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-ash">
            Aircraft Digital Twin
          </span>
          <h2 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[3.5rem]">
            One aircraft. Every component.
            <br />
            One digital identity.
          </h2>
          <p className="mt-6 max-w-md font-body text-[1.05rem] leading-relaxed text-ash">
            Every major system on the aircraft carries its own verified digital record.
            Hover a marker to see a component's identity, inspection history and
            maintenance status — a concept view of the twin, not a live fleet feed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="relative mt-16 aspect-[16/9] w-full overflow-hidden border border-pebble bg-[var(--color-ink)]"
        >
          <img
            src={AIRCRAFT_STILL}
            alt="Side profile of an aircraft in flight, used to illustrate component identity markers across major systems"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {/* Subtle darkening so the white/amber marker dots and their
              ink tooltips stay legible against the bright in-flight sky
              in the source photo, without editing the still itself. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/35 via-transparent to-[var(--color-ink)]/10"
          />
          <ComponentHotspots />
        </motion.div>

        <p className="mt-4 font-body text-xs text-ash">
          Example component data shown for illustration. Live values are available inside
          the platform for aircraft and components you have access to.
        </p>
      </div>
    </section>
  );
};

export default DigitalTwinSection;
