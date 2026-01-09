# Accessibility Verification – 2025-09-28

Manual checklist (WCAG 2.2 AA focus):

- **Keyboard navigation**: Tab/Shift+Tab traverses header → input → add button → list items → controls; Escape on toast clears focus with no trap; verified on Chrome/Safari.
- **Screen reader sanity**: VoiceOver announces section headings (`h1`, `h2`), live status updates (`aria-live` region), checkbox state changes, and import/export controls with labels.
- **Focus visibility**: Every interactive element shows a 2px brand outline (`src/app.css:18`).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables transitions (`src/app.css:24`).
- **Reordering**: Items support both drag-and-drop (mouse/touch) and keyboard reordering (Space to grab, Arrow keys to move, Space to drop, Escape to cancel). Visual feedback provided via outline and screen reader announcements.

Runbook: `npm run test:a11y` for automated axe scan + manual checklist each release.
