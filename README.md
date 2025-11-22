# A New Day

A New Day is a simple daily to-do app with one small, unique feature: at midnight, your list resets automatically and unchecks all your items. And the next day, the only thing to do is start your list again.

It is designed to support those recovering from mental health challenges, when tasks many may take for granted (rising from bed, brushing one’s teeth, eating regular meals) have become seemingly insurmountable obstacles.

The app does not track progress or ask to share results on social media. It does not judge you. Its one function is to focus on this moment, today. A New Day is a quiet tool for people rebuilding routines.


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
- **Drag-and-drop keyboard controls**:
  - Tab to focus drag handle → Space/Enter to activate drag mode
  - Arrow keys (↑/↓) to move item position
  - Space/Enter to drop item → Escape to cancel
  - Works within lists and across lists (multi-list mode)
- Respects `prefers-reduced-motion` by shortening animation durations.
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

This application is a self-guided aid and does not replace professional or emergency support. If you are in a crisis, please seek local support services. You are important.