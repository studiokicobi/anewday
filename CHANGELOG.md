## [1.0.0] - 2025-11-09

### Added

- **Dark Mode**: Full theme support with light, dark, and system options
  - Class-based Tailwind dark mode strategy
  - Persistent theme preference in localStorage
  - All components updated with dark variants (App, TodoItem, SettingsDrawer)
  - Theme switcher in Settings → Appearance
- **Enhanced Delete UX**: Multiple interaction methods for deleting tasks
  - Undo toast with 5-second window (replaces confirmation dialog)
  - Hover-to-reveal delete buttons on desktop
  - Keyboard shortcuts (Delete/Backspace keys)
  - Swipe-to-delete gesture on mobile (100px threshold)
- **Improved Focus Indicators**: Consistent focus rings across all interactive elements
  - Custom checkbox focus styling using Tailwind Plus pattern
  - Visible focus states on all buttons and form controls

### Changed

- **Settings Drawer**: Complete redesign as bottom sheet
  - Slides up from bottom to 80vh height
  - Smooth animations (fly transition for drawer, fade for overlay)
  - Scrollable content areas with proper overflow handling
  - Expanded max-width for better content display
- **Color Scheme**: Migrated from slate to brand color palette
  - Updated all UI elements to use consistent brand-* colors
  - Light theme default (#F4F4F5) with proper dark mode contrast
  - Theme color meta tag updated to match light theme
- **Settings Button**: Changed from fixed positioning to sticky footer
  - Stays at bottom of viewport when content is short
  - Pushes down naturally when content extends beyond viewport
- **About Content**: Moved from standalone page into Settings drawer
  - Updated copy with more detailed description
  - Enhanced FAQ section with better formatting
  - Improved accessibility information

### Removed

- **Legacy Icons**: Cleaned up unnecessary icon files (~4.8MB saved)
  - All iOS-specific splash screens (apple_splash_*)
  - Windows tile images (tile.png, tile-wide.png)
  - Redundant icon sizes (16, 32, 48, 64, 128, 256, 384, 1024)
  - Old iOS icons (anewday-icon-*)
- **Standalone Info Page**: Removed `/public/info.html` (content integrated into Settings)
- **Lighthouse Config**: Removed info.html from test URL array

### Fixed

- **Date Display**: Removed trailing period from date format
- **Embedded List Selector**: Fixed tab navigation and click handling
- **Theme Toggle Buttons**: Corrected dark mode styling (dark bg with white text when selected)
- **Item Order Persistence**: Added position tracking to ensure task order remains stable after refresh

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
