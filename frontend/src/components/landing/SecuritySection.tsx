import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    title: 'NFC-bound component identity',
    body: 'Each component is linked to a unique digital identity that can be verified through its physical NFC tag.',
  },
  {
    title: 'Tamper-evident records',
    body: 'Unauthorized changes to component history can be detected and trusted records preserved.',
  },
  {
    title: 'Role-based access',
    body: 'Users only access the component information and actions permitted by their role.',
  },
  {
    title: 'Company isolation',
    body: 'Organizations operate within controlled environments with separated component data.',
  },
  {
    title: 'Secure authentication',
    body: 'Authenticated users and authorized requests protect access to component records.',
  },
  {
    title: 'Traceable lifecycle history',
    body: 'Important component events contribute to a persistent record from registration through maintenance.',
  },
];

export const SecuritySection: React.FC = () => {
  // Feedback is local to each block — border/heading shift on the block
  // itself only. No sibling dimming here (unlike ProblemSection /
  // CompanyAccessSection), per this file's scope.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="security" className="bg-white px-6 py-28 text-ink md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.5rem]"
        >
          Security behind every identity.
        </motion.h2>

        <div
          className="mt-16 grid grid-cols-1 border-t border-pebble sm:grid-cols-2 lg:grid-cols-3"
          onTouchStart={() => setActiveIndex(null)}
        >
          {FEATURES.map((feature, i) => {
            const isActive = activeIndex === i;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                tabIndex={0}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex((cur) => (cur === i ? null : cur))}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
                className={`border-b border-r px-6 py-10 outline-none transition-colors duration-300 first:pl-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  isActive ? 'border-ink/30' : 'border-pebble'
                }`}
              >
                <h3
                  className={`font-display text-lg font-semibold transition-transform duration-300 ease-out ${
                    isActive ? 'translate-x-1' : 'translate-x-0'
                  }`}
                >
                  {feature.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-ash">{feature.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;