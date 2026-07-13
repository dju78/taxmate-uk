# Phase 9A Final Sign-Off

TaxMate UK is a working browser-based UK tax-management prototype with test-covered
tax-year and transaction calculations. It is not production-ready, not HMRC-approved,
and not a tax-filing service.

## Commit and CI

- **Final commit SHA**: `d550305d8f476f4947535c7839ef428cfb727d4f`
- **CI run**: [Run #30](https://github.com/dju78/taxmate-uk/actions/runs/29274420154) — **Success**, total duration 1m 31s
  - Set up job — 1s
  - Run actions/checkout@v6 — 1s
  - Set up Node.js — 1s
  - Install dependencies (`npm ci`) — 11s
  - Lint — 6s
  - Typecheck — 4s
  - Test — 9s
  - Build — 1s
  - Install Playwright Browsers — 24s
  - Run Playwright E2E Tests — 25s
  - Upload Playwright Artifacts — 1s
  - Post steps — succeeded
  - Artifact produced: `playwright-report` (234 KB)
- **Root cause of the prior CI failures**: `package-lock.json` was out of sync —
  `@emnapi/core`/`@emnapi/runtime` existed only nested under
  `@rolldown/binding-wasm32-wasi`, not as the top-level entries the dependency tree
  came to require (via `@tailwindcss/oxide-wasm32-wasi`'s bundled dependencies).
  Regenerating the lockfile from a clean install (commit `d550305`) resolved it.

## Deployment

- **Production URL**: `https://taxmate.omoyelejd.co.uk/`
- **Deployed JS bundle**: `assets/index-B5WgtxfS.js`
- **Deployed CSS bundle**: `assets/index-B_x7Vqs-.css`
- Confirmed identical to a fresh local `npm run build` of the same commit (same
  content-hashed filenames), i.e. production is running the final committed source.

## Test results

| Suite | Result |
|---|---|
| Unit/component (`npm test`) | **229 / 229 passed** (12 test files) |
| Playwright E2E, local build (`npm run test:e2e`) | **42 passed, 0 failed, 0 flaky, 0 skipped** (14 tests × desktop/tablet/mobile) |
| Playwright E2E, live production (`npm run test:e2e:live`) | **42 passed, 0 failed, 0 flaky, 0 skipped** against `https://taxmate.omoyelejd.co.uk/` |

## Environment

- **Local**: Node `v24.12.0`, npm `11.6.2`
- **CI**: Node `22` (pinned via `.nvmrc` and `actions/setup-node@v6`), run on `ubuntu-latest`
- **Screenshot capture browser**: Chromium `150.0.7871.24` (via Puppeteer `v25.3.0`)

## Screenshots

Captured live against `https://taxmate.omoyelejd.co.uk/` on **2026-07-13**.

| Viewport | Dimensions | File |
|---|---|---|
| Desktop | 1280 × 900 | `phase9a-desktop.png` |
| Tablet | 768 × 1024 | `phase9a-tablet.png` |
| Mobile | 375 × 812 | `phase9a-mobile.png` |

No demo data was loaded for these captures — each shows the genuine first-run empty
state after the onboarding modal was dismissed via Skip.

## Production checks confirmed

- No console errors, no unhandled page errors, no failed requests (all 200s)
- Income CRUD persists after a hard refresh (manually verified: added a record,
  reloaded, value remained)
- Expense CRUD persistence, reports reconciliation, print-view section visibility,
  invalid-date-range handling, and import/export flows are all exercised directly
  by the live Playwright suite above
- Onboarding first-run modal shows the required "Stored on this device" heading
  (not a "100% Private" claim) and Skip works correctly

## Remaining known limitations

- **Node version drift**: this development machine runs Node 24 locally with no
  nvm/volta available to pin to the `.nvmrc`-declared 22; `package.json` engines
  (`>=22.0.0`) permit this. CI itself runs on the pinned Node 22 and is green, so
  this is a local-tooling note, not a Phase 9A functional gap.
- No backend, authentication, or HMRC integration exists or is planned for this
  phase — the app remains strictly browser-local (localStorage only), by design.
- Tax figures shown are the user's own recorded income/expenses, not a computed
  tax liability — the app does not estimate tax owed.
