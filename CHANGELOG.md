## [0.1.0-rc] - 2025-09-28

### Added

- PWA offline shell, manifest, and installability.
- Privacy: strict CSP, zero telemetry, storage persistence request.
- Migration: legacy localStorage/IDB → structured IndexedDB with rollback and backup.
- Accessibility: keyboard flows, aria-live status, automated axe checks.
- Tests: unit reset, E2E reset across midnight/DST, a11y audits.
- Tooling: ESLint/Prettier setup, accessibility & privacy documentation, issue/PR templates.

### Changed

- Replace ad-hoc reload timer with idempotent date-key reset.
- Added runtime CSP meta tags and robots.txt for static hosting.

### Performance

- Budgets enforced via LHCI; current JS bundle < 50 KB gz.
