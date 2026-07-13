# TaxMate UK 💷

**TaxMate UK** is a working browser-based UK tax-management **prototype** with test-covered tax-year and transaction calculations. It helps sole traders record income and expenses and see clear, tax-year-aware summaries.

> ⚠️ **Prototype status.** Data is stored only in your browser (`localStorage`) — there is no account, server, encryption or backup service, and it must not be used for filing decisions. Export a backup regularly from **Settings → Data & backup**.

A product of **Daramola Digital Labs**.

## Features

- **Income** — record client/source, category, amount and status (Received / Pending / Overdue). Metrics are separated into **received**, **invoiced**, **outstanding** and **overdue** so unpaid invoices are never shown as cash received.
- **Expenses** — record merchant, category, amount and payment method.
- **Dashboard** — recorded cash surplus, income received, expenses and an income-vs-expenses chart, all driven from your saved records and scoped to the active UK tax year.
- **Tax estimate preview** — shows recorded income, expenses and pre-tax surplus, with an explicit disclaimer that tested UK tax rules are not yet implemented.
- **UK tax year aware** — calculations use the 6 April – 5 April tax year with an exclusive upper boundary and local-date parsing. Averages are reported per **completed tax month**.
- **Responsive** — full sidebar on desktop, icon rail on tablet, top bar + bottom navigation on mobile.
- **Accessible** — dialogs use `role="dialog"`/`aria-modal` with focus trapping and Escape support; forms wire errors via `aria-invalid`/`aria-describedby`; keyboard focus is visible.
- **Backup/export** — export all records as JSON or CSV.

## Tech stack

- React 19 + Vite + TypeScript
- Tailwind CSS (v4) for styling
- Zustand for global state management
- Vitest for unit tests
- Playwright for E2E tests
- Deployed on Netlify (`netlify.toml` sets caching and security headers)

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173/)
npm test         # run the Vitest suite
npm run test:e2e # run the Playwright E2E tests
npm run lint     # run ESLint
npm run build    # production build to dist/
```

## Testing

Financial calculations are covered by a Vitest suite in [`src/storage.test.ts`](src/storage.test.ts) and [`src/store.test.ts`](src/store.test.ts). End-to-end workflows (CRUD operations, demo data, storage clearing, and data persistence) are verified by Playwright in [`tests/phase8.spec.ts`](tests/phase8.spec.ts). CI runs lint, typecheck, tests, build, and E2E on every push and pull request (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Status

A working portfolio prototype — **not** a secure tax application and not software to rely on for filing decisions.

## License

© 2026 Daramola Digital Labs. All rights reserved.
