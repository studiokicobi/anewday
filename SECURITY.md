# Security Policy

- **Data residency**: All data is stored locally (IndexedDB). No analytics or telemetry.
- **Content Security Policy**: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';`
- **Exports**: Optional passphrase-encrypted (AES-GCM). Passphrases are never persisted and cleared from memory after use.
- **Offline/PWA**: Service Worker caches app shell only; no third-party requests.
- **Reporting**: Open a GitHub issue with a minimal reproduction. Do not include personal data in logs.
- **Verification logs**: See `docs/privacy-offline.md` for the most recent offline/telemetry audit steps.
