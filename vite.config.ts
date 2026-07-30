import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'robots.txt'],
      manifest: false, // Use existing manifest.webmanifest
      injectRegister: null, // Disable auto-injection, we'll register manually
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // Disable in dev to avoid conflicts
      },
    }),
    {
      name: 'html-csp-nonce',
      transformIndexHtml: {
        order: 'post',
        handler(html, context) {
          const isDev = context.server?.config.command === 'serve';

          // Add nonce to scripts and stylesheets so production CSP can allow them
          html = html.replace(/<script type="module"/g, '<script type="module" nonce="anewday"');
          html = html.replace(/<link rel="stylesheet"/g, '<link rel="stylesheet" nonce="anewday"');

          if (isDev) {
            // Skip injecting CSP in dev so Vite's injected scripts (e.g. /@vite/client)
            // aren't blocked. This avoids the blank page where only the skip link shows.
            return html;
          }

          const cspContent =
            "default-src 'self'; script-src 'self' 'strict-dynamic' 'nonce-anewday'; style-src 'self' 'nonce-anewday'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'";

          if (!html.includes('Content-Security-Policy')) {
            html = html.replace(
              /<meta name="theme-color"/,
              `<meta http-equiv="Content-Security-Policy" content="${cspContent}" />\n    <meta name="theme-color"`
            );
          }

          return html;
        },
      },
    },
    visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
  ],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      provider: 'v8',
    },
    // '.claude/**' skips agent worktrees, which are full checkouts nested
    // inside the repo; without it their specs are collected twice and the
    // Playwright ones fail under Vitest.
    exclude: ['tests/e2e/**', 'tests/a11y/**', 'node_modules/**', '.claude/**'],
  },
  build: {
    // Optimize chunk size and tree-shaking
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: 'esbuild',
    modulePreload: {
      polyfill: false, // Modern browsers only, saves bytes
    },
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable code-splitting for better initial load
      },
    },
  },
});
