# Performance Documentation

## Overview

A New Day maintains a Lighthouse performance score of **97/100** with a bundle size of **222 KB (71 KB gzipped)**. This document details our performance optimizations, metrics, and the reasoning behind key decisions.

## Lighthouse Metrics

### Current Scores (v2.0.0)

| Metric                             | Value    | Score     | Weight |
| ---------------------------------- | -------- | --------- | ------ |
| **First Contentful Paint (FCP)**   | 1.4-2.1s | 0.81-0.98 | 10%    |
| **Largest Contentful Paint (LCP)** | 2.3s     | 0.94      | 25%    |
| **Total Blocking Time (TBT)**      | 0ms      | 1.00      | 30%    |
| **Cumulative Layout Shift (CLS)**  | 0        | 1.00      | 25%    |
| **Speed Index (SI)**               | 1.4-2.1s | 0.99-1.00 | 10%    |

**Overall Performance Score:** 97/100

### Score Calculation

```
Performance = (FCP × 10%) + (SI × 10%) + (LCP × 25%) + (TBT × 30%) + (CLS × 25%)
           ≈ (0.90 × 10) + (1.0 × 10) + (0.94 × 25) + (1.0 × 30) + (1.0 × 25)
           = 9.0 + 10.0 + 23.5 + 30.0 + 25.0
           = 97.5 → 97
```

## Bundle Analysis

### Production Build Output

```
dist/index.html                   2.02 kB │ gzip:  0.97 kB
dist/assets/index-CBGdTuQ8.css   30.89 kB │ gzip:  5.77 kB
dist/assets/index-NHR9dEpo.js   222.28 kB │ gzip: 70.74 kB
```

### Bundle Composition

The 222 KB JavaScript bundle includes:

1. **Svelte 5 Runtime** (~25 KB)
   - Core reactive system
   - Component rendering
   - Store subscriptions and reactivity

2. **@tailwindplus/elements** (~84 KB)
   - UI component library
   - _Note: Tested removal (38% size reduction) but FCP regressed from 1.4s → 2.1s_
   - Decision: Keep for performance stability

3. **Application Code** (~80 KB)
   - Components (TodoList, TodoItem, Settings, etc.)
   - State management (stores/state.ts)
   - IndexedDB operations (lib/db.ts)
   - Midnight reset logic (lib/reset.ts)
   - Native HTML5 drag-and-drop implementation

4. **Remaining** (~33 KB)
   - Service worker registration
   - Encryption utilities (AES-GCM, PBKDF2)
   - Vite/build overhead

### Bundle Optimization Attempts

**Tested:** Removing @tailwindplus/elements

- **Result:** 138 KB bundle (46.94 KB gzipped) - 38% reduction
- **Issue:** FCP regressed from 1.4s to 2.1s
- **Decision:** Reverted - bundle size reduction not worth performance degradation

## Optimizations Implemented

### 1. Critical CSS Inlining

**Problem:** CSS file (31 KB) blocks initial render of hero content (h1 + date)

**Solution:** Inline minimal critical CSS directly in `<head>`

```html
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: 'Work Sans', ...;
    background-color: #f5f3f2;
  }
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #1f1a18;
    }
  }
  h1 {
    margin: 0;
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-weight: 500;
    letter-spacing: -0.04em;
    color: #18181b;
  }
  @media (prefers-color-scheme: dark) {
    h1 {
      color: #c1b5b0;
    }
  }
</style>
```

**Impact:**

- Eliminates render-blocking CSS for LCP element
- Reduces potential LCP delay by ~1,810ms (80% of render time)
- Adds 0.5 KB to HTML size (acceptable trade-off)

### 2. Font Preloading with Priority Hints

**Problem:** Web fonts discovered late in page load, delaying FCP

**Solution:** Preload critical fonts with `fetchpriority="high"`

```html
<link
  rel="preload"
  href="/fonts/WorkSans-Regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
  fetchpriority="high"
/>
<link
  rel="preload"
  href="/fonts/WorkSans-Medium.woff2"
  as="font"
  type="font/woff2"
  crossorigin
  fetchpriority="high"
/>
```

**Impact:**

- Fonts load before other resources
- Reduces FOUT (Flash of Unstyled Text)
- Combined with `font-display: swap` in CSS

### 3. Build Configuration Optimizations

**Vite Configuration:**

```typescript
build: {
  minify: 'esbuild',           // Fast, effective minification
  target: 'es2020',            // Modern browsers only
  cssMinify: 'esbuild',        // CSS minification
  modulePreload: {
    polyfill: false            // No polyfill for modern browsers (-1 KB)
  },
  rollupOptions: {
    output: {
      manualChunks: undefined  // Single bundle for faster initial load
    },
  },
}
```

**Rationale:**

- **No Code Splitting:** Single bundle loads faster than multiple chunks for small apps
- **ES2020 Target:** Smaller output, no legacy browser polyfills needed
- **esbuild Minifier:** Fast build times, excellent compression

### 4. Service Worker Strategy

**Configuration:**

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    skipWaiting: true,
    clientsClaim: true,
  },
});
```

**Trade-offs:**

- **Larger initial cache:** All assets precached (~489 KB)
- **Benefit:** Instant offline functionality
- **Decision:** Worth it for PWA offline-first experience

## Performance Bottlenecks & Constraints

### 1. Redirect Delay (2,250ms)

**Issue:** Hosting redirect from root to `/index.html`

**Impact:** Adds 2.25s to all metrics

**Resolution:** Not fixable at application level (hosting configuration)

### 2. Framework Baseline (95 KB Unused JS)

**Issue:** Lighthouse reports 95 KB "unused JavaScript"

**Analysis:**

- Svelte runtime: Required for reactivity
- Component code: Loaded on-demand (Svelte's lazy evaluation)
- Not truly "unused" - just not executed during initial paint

**Resolution:** Acceptable for framework-based app

### 3. LCP Render Delay (1,810ms)

**Issue:** 80% of LCP time spent in rendering phase

**Causes:**

- DOM construction
- Style calculation
- Layout computation
- Paint operations

**Mitigation:** Critical CSS inlining reduces this (implemented)

## Why Not 100?

Achieving a consistent 100 Lighthouse score would require:

1. **Eliminating the redirect** (hosting-level, not in our control)
2. **Removing all framework overhead** (incompatible with app requirements)
3. **Aggressive code splitting** (worse UX for this app size)
4. **Server-side rendering** (adds complexity, not needed for PWA)

**Trade-offs Assessment:**

- Current score (97) represents excellent real-world performance
- Further optimizations would sacrifice maintainability or UX
- Lighthouse scores vary ±3 points due to environmental factors
- **95-99 range is considered production-ready**

## Testing Performance Locally

### Running Lighthouse

```bash
# Start preview server
npm run build && npm run preview

# In another terminal, run Lighthouse
npx lighthouse http://localhost:4173 \
  --only-categories=performance \
  --output=json,html \
  --output-path=.lighthouse.report \
  --chrome-flags="--headless"
```

### Analyzing Bundle Size

```bash
npm run build
# Opens dist/stats.html automatically (generated by rollup-plugin-visualizer)
open dist/stats.html
```

The visualizer shows:

- Module sizes (parsed, gzipped, brotli)
- Dependency tree
- Code redundancy analysis

### Monitoring Performance Regressions

**Before committing:**

```bash
npm run build
# Check bundle sizes in output
# Expected: ~222 KB JS, ~31 KB CSS
```

**Red flags:**

- Bundle size increase >10% without feature additions
- Lighthouse score drops below 95
- FCP/LCP increasing significantly

## Performance Budget

| Metric           | Target  | Current  | Status |
| ---------------- | ------- | -------- | ------ |
| JS Bundle        | <250 KB | 222 KB   | ✅     |
| CSS Bundle       | <50 KB  | 31 KB    | ✅     |
| Lighthouse Score | >95     | 97       | ✅     |
| FCP              | <2.5s   | 1.4-2.1s | ✅     |
| LCP              | <2.5s   | 2.3s     | ✅     |
| TBT              | <300ms  | 0ms      | ✅     |
| CLS              | <0.1    | 0        | ✅     |

## Key Decisions & Rationale

### Single Bundle vs. Code Splitting

**Decision:** Single bundle

**Reasoning:**

- App is small (222 KB total)
- Users load entire app on first visit anyway
- Eliminates HTTP roundtrip overhead for chunks
- Simpler caching strategy for service worker
- Better for offline-first PWA experience

### Keeping @tailwindplus/elements

**Decision:** Keep despite 84 KB cost

**Reasoning:**

- Removal caused FCP regression (1.4s → 2.1s)
- Likely provides critical initialization for UI components
- Bundle size reduction doesn't matter if performance degrades
- 71 KB gzipped is acceptable for full-featured PWA

### ES2020 Target (No IE11 Support)

**Decision:** Modern browsers only

**Reasoning:**

- Smaller bundle size (no polyfills)
- Faster execution (native features)
- IndexedDB + Service Workers require modern browsers anyway
- IE11 usage <0.5% globally

## Monitoring & Alerts

**Manual checks:**

- Run Lighthouse before major releases
- Check bundle size after dependency updates
- Test on slow 3G network periodically

**Future:** Consider Lighthouse CI in GitHub Actions

- Automated performance regression detection
- Comment on PRs with performance impact

## References

- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Web.dev Performance Patterns](https://web.dev/patterns/web-vitals-patterns/)
- [Critical CSS Best Practices](https://web.dev/extract-critical-css/)
- [Font Loading Strategies](https://web.dev/font-best-practices/)

---

Last updated: November 2025
Current version: 2.0.0
