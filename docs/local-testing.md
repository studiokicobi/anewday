# Local Testing Guide

## Prerequisites

- Node.js 22.23.2 (see `.nvmrc` for convenience)
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
   This serves the contents of `dist/` on http://127.0.0.1:4173. Playwright
   starts its own preview on a different port — see below.

## Test Suites

- **Type check:** `npm run check`
- **Lint:** `npm run lint`
- **Formatting:** `npm run format`
- **Unit tests:** `npm run test:unit`
- **End-to-end tests:** `npm run test:e2e`
  - Builds the app, then runs Playwright pointing at a preview server.
- **Accessibility (axe) suite:** `npm run test:a11y`
- **Budgets/Lighthouse CI:** `npm run check:budgets` (runs the installed Lighthouse CLI against the freshly built `dist/` using `budgets.json`).
- **Lighthouse:** `npm run lhci`

All commands assume ports 5173 (dev) and 4173 (`npm run preview`) are available.

### Playwright's preview port

`npm run test:e2e` does not use 4173. Playwright derives a port from the path of
the checkout it is running in, in the range 4173–4372, and always starts its own
server rather than reusing one that is already listening.

This is deliberate. Agent worktrees under `.claude/worktrees/` are full
checkouts, so several copies of the suite can run at once. On a shared port they
served each other's `dist/` and tore each other's server down mid-run, which
shows up as `page.goto: net::ERR_CONNECTION_REFUSED` and reads as a test
failure rather than as a collision.

- CI has a single checkout, so it keeps 4173.
- `PREVIEW_PORT=4999 npm run test:e2e` pins a port when you need a known one (the
  same variable applies to `npm run lighthouse`). `PLAYWRIGHT_PORT` still works.
- A clash with an unrelated local service fails loudly with "port already in
  use" instead of quietly testing against whatever answered.

Dependency audits: `npm run audit:dependencies` requires zero findings in both production and development dependencies.

TypeScript remains on version 6 until Svelte Check and typescript-eslint support version 7. Node type definitions stay on version 22 to match the runtime; jsdom 30 requires Node 22.22.2 or newer.
