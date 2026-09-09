import React, { useLayoutEffect } from 'react';
import { useLenis } from '../lib/useLenis';
import { LandingNav } from '../components/landing/LandingNav';
import { Hero } from '../components/landing/Hero';
import { ProblemSection } from '../components/landing/ProblemSection';
import { SolutionFeature } from '../components/landing/SolutionFeature';
import { DigitalTwinSection } from '../components/landing/DigitalTwinSection';
import { ComponentPassport } from '../components/landing/ComponentPassport';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TraceabilityTimeline } from '../components/landing/TraceabilityTimeline';
import { ComponentExplorer } from '../components/landing/ComponentExplorer';
import { BlockchainHistory } from '../components/landing/BlockchainHistory';
import { AircraftHealth } from '../components/landing/AircraftHealth';
import { AnalyticsTeaser } from '../components/landing/AnalyticsTeaser';
import { CompanyAccessSection } from '../components/landing/CompanyAccessSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';
import { SectionProgress } from '../components/landing/SectionProgress';

export const LandingPage: React.FC = () => {
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);
  useLenis();

  return (
    <div className="min-h-screen bg-[var(--bg-app)] font-body text-ink">
      <LandingNav />
      <Hero />
      <SectionProgress />
      <div className="px-3 pb-3 pt-3 md:px-5 md:pb-5 md:pt-5">
        <div className="mx-auto max-w-[1680px] overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_90px_-30px_rgba(79,70,229,.14)] md:rounded-[34px]">
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
