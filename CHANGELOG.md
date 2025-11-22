## [Unreleased]

### Added

- **Drag-and-Drop Reordering**: Reorder tasks within lists and move between lists
  - Custom drag handles with visual feedback (grab/grabbing cursor)
  - Full keyboard support: Tab to drag handle, Space/Enter to activate, Arrow keys to move, Space/Enter to drop
  - Smooth animations during reordering (200ms flip transition)
  - Cross-list dragging in multi-list mode (Morning, Anytime, Evening)
  - Touch-friendly: works on mobile with touch events
  - WCAG compliant with proper ARIA roles and labels
- **Smooth Animations**: Integrated svelte/transition for polished interactions
  - Slide transition (200ms) for item deletion
  - Fly transition (300ms) for toast notifications

### Changed

- **Task Input Length**: Doubled maximum task length from 80 to 160 characters for more detailed tasks
- **Multi-List Selector**: List dropdown now always visible in multi-list mode (previously only appeared while typing)
- **Checkbox Size**: Reduced checkbox size slightly for better visual balance with drag handles
- **Icon Set**: Updated favicon and app icons with refreshed design
- **Mobile Touch Interactions**: Significantly improved checkbox UX on mobile
  - Removed scale animation on tap for cleaner interaction
  - Disabled tap highlight and text selection during item interaction
  - Improved touch target detection for text nodes in labels
  - Better centered checkmark with optimized SVG viewBox
- **Dark Mode Contrast**: Lightened completed item text (brand-600 → brand-500)

### Fixed

- **Font Preload Warnings**: Moved @font-face declarations to inline critical CSS to eliminate console warnings
- **TypeScript Errors**: Added proper type definitions for svelte-dnd-action custom events
- **Accessibility Compliance**: Separated aria-live regions from drag zones to avoid ARIA role conflicts
- **CSP Compliance**: Added nonce attribute to inline critical CSS
- **Lighthouse CI**: Updated audit configuration for newer Lighthouse scoring modes
- **Keyboard Navigation Tests**: Fixed timing issue with slide transitions in CI

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
