import React from 'react';
import { useLenis } from '../lib/useLenis';
import { LandingNav } from '../components/landing/LandingNav';
import { Hero } from '../components/landing/Hero';
import { ProblemSection } from '../components/landing/ProblemSection';
import { SolutionFeature } from '../components/landing/SolutionFeature';
import { ComponentPassport } from '../components/landing/ComponentPassport';
import { TraceabilityTimeline } from '../components/landing/TraceabilityTimeline';
import { CompanyAccessSection } from '../components/landing/CompanyAccessSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { Footer } from '../components/landing/Footer';
import { SectionProgress } from '../components/landing/SectionProgress';

export const LandingPage: React.FC = () => {
  useLenis();

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Nav sits above the pinned cinematic hero in normal document flow.
          It is not fixed, so it scrolls away naturally as the pinned
          frame sequence takes over the full viewport — matching the
          original nav behavior, just now on top of Hero's canvas instead
          of a static PNG. Hero itself is full-bleed: no outer padding, no
          max-width, no rounding, no overflow-hidden — required for its
          `position: sticky` pin to work, since sticky pins to the nearest
          ancestor with `overflow` set rather than the viewport. */}
      <LandingNav />
      <Hero />

      {/* Fixed, viewport-level chrome — kept as a sibling here rather than
          nested inside the rounded/overflow-hidden container below.
          `position: fixed` is normally positioned relative to the
          viewport, but overflow-hidden isn't the risk here so much as a
          transform: any ancestor with a CSS transform becomes the
          containing block for fixed descendants instead of the viewport,
          which would make the dot nav scroll away instead of staying put.
          If useLenis() is configured with a transformed wrapper/content
          mode (rather than native-scroll smoothing), double check that
          this still renders correctly outside that wrapper. */}
      <SectionProgress />

      <div className="px-3 pb-3 pt-3 md:px-5 md:pb-5 md:pt-5">
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[28px] shadow-[0_24px_70px_-20px_rgba(0,13,16,0.18)] md:rounded-[32px]">
          <main>
            <ProblemSection />
            <SolutionFeature />
            <ComponentPassport />
            <TraceabilityTimeline />
            <CompanyAccessSection />
            <SecuritySection />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};