# Aero-Sense — Frontend

Secure Aircraft Component Verification & Digital Maintenance Platform.

React 19 + TypeScript + Vite frontend for Aero-Sense, talking to the Rust
(axum/sqlx) backend in `../backend`. Public marketing site (landing page,
cinematic scroll sequence) plus an authenticated multi-tenant dashboard for
aircraft, component, maintenance, verification, and analytics management.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion — page/section animation
- Lenis — smooth scroll
- React Router v7
- Axios — API client (`src/services/api.ts`)
- Lucide React — icons
- oxlint — linting

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api -> http://localhost:8080
npm run build    # tsc -b && vite build
npm run lint      # oxlint
```

The dev server proxies `/api` to the backend at `http://localhost:8080` (see
`vite.config.ts`). Start the backend first — see `../backend`.

## Project structure

```
src/
  components/
    landing/     Marketing site sections (Hero, LandingNav, SectionProgress, ...)
    ui/          Shared UI primitives
  pages/         Route-level pages (dashboard, aircraft, components, ...)
  context/       Auth + toast context providers
  lib/           Scroll/animation hooks (Lenis, cinematic frame sequence)
  services/      API client
  types/         Shared TypeScript types
```

The landing page (`src/pages/LandingPage.tsx`) and the authenticated app use
separate design tokens by design — see the comment at the top of
`src/index.css`. The landing page's tokens (`--color-ink`, `--color-ash`,
`--color-pebble`, `--color-clay`) are intentionally not shared with the
dashboard's tokens (`--accent`, `--card-bg`, etc.) further down the same file.

## Redesign status

`AERO_SENSE_2_0_UI_BLUEPRINT.md` describes a full premium-aerospace redesign
in 12 phases. Current status against that plan:

| Phase | Scope | Status |
|---|---|---|
| 1. Audit | Inspect existing repo/components before changing anything | Done |
| 2. Design system | Tokens, buttons, cards | Already in place pre-redesign (ink/ash/pebble/clay, `.pill-btn`, `.hairline`) |
| 3. Navigation + Hero | Floating nav, hero typography, CTA | Hero/cinematic scroll already implemented; nav mobile menu added, CTA recolored to match the landing palette; scroll-triggered floating capsule **not yet done** — needs coordinating with Hero's sticky pin and `SectionProgress`'s fixed dot-nav to avoid overlap |
| 4. Aircraft Digital Twin | 3D aircraft, hotspots, isolation | `ComponentHotspots.tsx` audited: hotspots previously only opened on hover/focus, so they were dead on touch devices — added an explicit tap toggle plus `aria-expanded`/`aria-describedby`. Full 3D isolate/zoom-on-select interaction (blueprint Section 11) not yet built |
| 5. Verification | NFC scanner UI, scan states | `VerifyPage.tsx` audited: already close to spec (has a proper "Ready for Verification" empty state and a readable error banner) — no changes made this round |
| 6. Component Explorer | 3D carousel, detail panel | Not started |
| 7. Maintenance | Lifecycle timeline, due/overdue states | `MaintenancePage.tsx`, `TraceabilityTimeline.tsx` exist; not yet audited |
| 8. Blockchain | Immutable history timeline | Not started |
| 9. Analytics | Charts, health metrics | `AnalyticsPage.tsx` audited: was using the generic `"No data found"` text and dumping raw API error messages, both explicitly against blueprint Sections 37/39 — replaced with a skeleton loading state, a human-readable error state with Retry, and a proper empty state. Chart/health-metric visuals beyond the existing stat cards not yet built |
| 10. Dashboard | Command-center redesign | Not started |
| 11. Responsive + accessibility | Cross-device, keyboard, reduced motion | Reduced-motion respected in landing animations; hotspot tap/keyboard support added this round; full pass not done |
| 12. Performance + cleanup | Bundle size, lazy loading, lint/build | `tsc -b`, `oxlint`, `vite build` all currently pass clean |

SEO metadata (title, description, Open Graph/Twitter tags, favicon) has been
updated in `index.html` per blueprint Section 41. The `og:image` currently
points at the small square favicon as a placeholder — swap in a real
1200×630 social preview image when one exists.

Known pre-existing issue (not introduced by the redesign): `tsc -b` reports
an unused `RoleFooter` in `src/components/Sidebar.tsx`.
