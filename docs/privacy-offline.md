# Offline & Privacy Verification

Date: 2025-09-28

Steps:

1. Build app (`npm run build`) and preview with `npm run preview`.
2. In Chrome DevTools > Network, toggle **Offline** and reload. App renders from cache; no network requests recorded.
3. Monitored Application tab → Service Workers: only `public/service-worker.js` registered, no external scope.
4. IndexedDB inspection confirms data stored locally under `anewday` database (stores: `meta`, `lists`, `items`).
5. Export/import feature tested with and without passphrase; passphrase field cleared after action (`src/App.svelte:95`).

Result: zero telemetry, offline shell functional.
