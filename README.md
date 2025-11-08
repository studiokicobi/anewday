# A New Day

A privacy-first daily checklist that resets at local midnight. The app runs entirely on your device, supports offline use, and offers optional encrypted exports for backups.

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

## Privacy & Offline

- All data local in IndexedDB. No external requests. Optional encrypted export/import (AES-GCM).
- On first run, the app requests persistent storage (`navigator.storage.persist()`); some platforms may still evict storage under pressure.
- Offline & telemetry verification notes are documented in `docs/privacy-offline.md`.

## Accessibility

- Full keyboard operation; visible focus; announcements via `aria-live`. Drag-sorting is disabled or has a keyboard fallback when `prefers-reduced-motion` is set.
- Manual audit log lives in `docs/a11y-report.md`.

## Testing

- Unit: `npm run test:unit` • E2E & a11y: `npm run test:e2e`
- Run targeted audits with `npm run test:a11y` and DST resilience via `npx playwright test tests/e2e/reset-dst.spec.ts`.
- Lint/type-check: `npm run lint` • Formatting: `npm run format` / `npm run format:fix`

## Performance & PWA

- Build: `npm run build` • Preview (SW scope): `npm run preview` then `npm run lhci` or `npm run lighthouse`
- Generate bundle stats with `npm run build:analyze` and validate budgets with `npm run check:budgets`.

## Documentation

- Accessibility checklist: `docs/a11y-report.md`
- Offline & privacy verification: `docs/privacy-offline.md`
- Security posture: `SECURITY.md`

## Disclaimer

A New Day is a self-guided routine aid and not a substitute for clinical or emergency care. If you are in crisis, contact local services immediately.
