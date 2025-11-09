# Security Policy

- **Data residency**: All data is stored locally (IndexedDB). No analytics or telemetry.
- **Content Security Policy**: `default-src 'self'; script-src 'self' 'strict-dynamic' 'nonce-anewday'; style-src 'self' 'nonce-anewday'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'`
- **Exports**: Optional passphrase-encrypted (AES-GCM). Passphrases are never persisted and cleared from memory after use.
- **Offline/PWA**: The service worker precaches the app shell and exposes a runtime cache entry for Google Fonts stylesheets (should they be requested); all other requests stay within the first-party origin.
- **Reporting**: Open a GitHub issue with a minimal reproduction. Do not include personal data in logs.
- **Verification logs**: See `docs/privacy-offline.md` for the most recent offline/telemetry audit steps.
