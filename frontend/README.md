# Aero-Sense — Frontend

Secure Aircraft Component Verification & Digital Maintenance Platform.

React 19 + TypeScript + Vite frontend for Aero-Sense, talking to the deployed Rust (axum/sqlx) backend. Public marketing site plus an authenticated multi-tenant dashboard for aircraft, component, maintenance, verification, and analytics management.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion — page/section animation
- Lenis — smooth scroll
- React Router v7
- Axios — API client (`src/services/api.ts`)
- Lucide React — icons
- oxlint — linting

## API

Production backend:

```text
https://aero-sense-backend-0y3l.onrender.com/api
```

The Axios client uses this Render backend by default. `VITE_API_BASE_URL` can be used to override the API base for another environment.

For local Vite development, `/api` requests are also proxied to the same deployed Render backend by `vite.config.ts`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Project structure

```
src/
  components/    Marketing and shared UI components
  pages/         Route-level pages
  context/       Auth + toast context providers
  lib/           Scroll/animation hooks
  services/      API client
  types/         Shared TypeScript types
```

The authenticated application uses the same production API client as the public website. Authentication uses JWT tokens stored in browser local storage and sent as Bearer tokens for protected API requests.
