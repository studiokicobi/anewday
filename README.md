# A New Day

A New Day is a daily checklist designed to support people rebuilding routines. It is a simple app with one defining feature: at midnight, the list resets automatically and unchecks all your items. And in the morning, you have to start the list again.

It is designed for those recovering from mental health challenges, when tasks others may take for granted (eating, sleeping, brushing your teeth, speaking to strangers) have become seemingly insurmountable obstacles. It can also be useful for anyone working to build or maintain habits.

## Getting started

```bash
npm install
npm run dev
```

Node 20 is recommended (`.nvmrc` provided).

Visit http://localhost:5173 to use the checklist. To test the production build (including service worker):

```bash
npm run build
npm run preview
```

Additional local testing tips live in `docs/local-testing.md`.

## Privacy

- All data local in IndexedDB. No external requests. Optional encrypted export/import (AES-GCM).
- On first run, the app requests persistent storage (`navigator.storage.persist()`); some platforms may still evict storage under pressure.
- Offline & telemetry verification notes are documented in `docs/privacy-offline.md`.

## Accessibility

- Full keyboard operation; visible focus; announcements via `aria-live`.
- Respects `prefers-reduced-motion` by shortening animation durations. Drag-and-drop reordering still requires pointer/drag interaction (there's no keyboard fallback yet).
- Manual audit log lives in `docs/a11y-report.md`.

## Testing

- Unit: `npm run test:unit` • E2E & a11y: `npm run test:e2e`
- Run targeted audits with `npm run test:a11y` and DST resilience via `npx playwright test tests/e2e/reset-dst.spec.ts`.
- Budgets/perf gate: `npm run check:budgets` (builds then runs Lighthouse CI with `budgets.json`).
- Lint/type-check: `npm run lint` • Formatting: `npm run format` / `npm run format:fix`

## Performance & PWA

- Build: `npm run build` • Preview (SW scope): `npm run preview` then `npm run lhci` or `npm run lighthouse`
- Generate bundle stats with `npm run build:analyze`; enforce size/perf budgets with `npm run check:budgets`.

## Deployment

See `docs/deployment-netlify.md` for complete Netlify deployment guide with custom domain setup.

**Quick start:**
```bash
# Connect repo to Netlify, then auto-deploys on push to main
# Build: npm run build
# Publish: dist
```

## Documentation

- **Deployment**: `docs/deployment-netlify.md`
- **Cross-browser testing**: `docs/cross-browser-testing.md`
- **Accessibility checklist**: `docs/a11y-report.md`
- **Offline & privacy verification**: `docs/privacy-offline.md`
- **Security posture**: `SECURITY.md`

## Disclaimer

A New Day is a self-guided aid and does not replace professional or emergency support. If you are in a crisis, please seek local support services. And remember you are loved.