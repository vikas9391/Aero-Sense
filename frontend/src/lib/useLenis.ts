import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Smooth inertial scroll for the public landing page only.
 * Mount this once at the top of LandingPage. It respects
 * prefers-reduced-motion by skipping entirely.
 */
export function useLenis() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      // Keep the cinematic hero responsive instead of making the page feel
      // like it is fighting the user's wheel/touch input.
      duration: 0.72,
      smoothWheel: true,
      syncTouch: true,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}