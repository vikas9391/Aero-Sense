import React, { useLayoutEffect } from 'react';
import { useLenis } from '../lib/useLenis';
import { LandingNav } from '../components/landing/LandingNav';
import { Hero } from '../components/landing/Hero';
import { ProblemSection } from '../components/landing/ProblemSection';
import { SolutionFeature } from '../components/landing/SolutionFeature';
import { DigitalTwinSection } from '../components/landing/DigitalTwinSection';
import { ComponentPassport } from '../components/landing/ComponentPassport';
import { HowItWorks } from '../components/landing/HowItWorks';
import { ComponentExplorer } from '../components/landing/ComponentExplorer';
import { TraceabilityTimeline } from '../components/landing/TraceabilityTimeline';
import { BlockchainHistory } from '../components/landing/BlockchainHistory';
import { AircraftHealth } from '../components/landing/AircraftHealth';
import { AnalyticsTeaser } from '../components/landing/AnalyticsTeaser';
import { CompanyAccessSection } from '../components/landing/CompanyAccessSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';
import { SectionProgress } from '../components/landing/SectionProgress';
import { AircraftCursor } from '../components/ui/aircraft-cursor';

export const LandingPage: React.FC = () => {
  // On a hard refresh, browsers try to restore the previous scroll
  // position by default (scrollRestoration: 'auto') — combined with
  // Lenis smooth-scroll and the pinned cinematic Hero, that means a
  // reload can land you mid-animation instead of at the top. This
  // disables that restoration and forces the page back to 0,0 on every
  // mount. useLayoutEffect (not useEffect) so it runs before paint and
  // before Lenis's own effect below initializes — Lenis reads whatever
  // window.scrollTop already is when it starts up, so ordering matters.
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useLenis();

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Page-wide overlay, not tied to any one section — fixed-position
          + pointer-events:none + its own max z-index, so mount order here
          doesn't affect stacking or layout of anything below it. Mounts
          once for the whole landing page rather than per-section. */}
      <AircraftCursor />

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
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[28px] shadow-[0_24px_70px_-20px_rgba(91,79,224,0.18)] md:rounded-[32px]">
          <main>
            <ProblemSection />
            <SolutionFeature />
            <DigitalTwinSection />
            <ComponentPassport />
            <HowItWorks />
            <ComponentExplorer />
            <TraceabilityTimeline />
            <BlockchainHistory />
            <AircraftHealth />
            <AnalyticsTeaser />
            <CompanyAccessSection />
            <SecuritySection />
            <FinalCTA />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;