# Local Testing Guide

## Prerequisites

- Node.js 20 (see `.nvmrc` for convenience)
- npm 10+
- Playwright browsers (installed automatically via `npm install`, but you can run `npx playwright install --with-deps` manually if needed)

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Launch the dev server with hot reload:

   ```bash
   npm run dev
   ```

   Visit http://127.0.0.1:5173.

3. Production preview (service worker & PWA tests):
   ```bash
   npm run build
   npm run preview
   ```
   This serves the contents of `dist/` on http://127.0.0.1:4173.

## Test Suites

- **Type check:** `npm run check`
- **Lint:** `npm run lint`
- **Formatting:** `npm run format`
- **Unit tests:** `npm run test:unit`
- **End-to-end tests:** `npm run test:e2e`
  - Builds the app, then runs Playwright pointing at a preview server.
- **Accessibility (axe) suite:** `npm run test:a11y`
- **Budgets/Lighthouse CI:** `npm run check:budgets` (runs `lhci autorun` against the freshly built `dist/` using `budgets.json`).
- **Lighthouse CI:** `npm run lhci`

All commands assume ports 5173 (dev) and 4173 (preview) are available.
