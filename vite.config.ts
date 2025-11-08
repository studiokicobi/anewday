import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'html-csp-nonce',
      transformIndexHtml(html, context) {
        const isDev = context.server?.config.command === 'serve';

        // Add nonce to scripts and stylesheets
        html = html.replace(/<script type="module"/g, '<script type="module" nonce="anewday"');
        html = html.replace(/<link rel="stylesheet"/g, '<link rel="stylesheet" nonce="anewday"');

        // Environment-specific CSP - more permissive for dev
        const cspContent = isDev
          ? "default-src 'self'; script-src 'self' 'strict-dynamic' 'nonce-anewday' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'"
          : "default-src 'self'; script-src 'self' 'strict-dynamic' 'nonce-anewday'; style-src 'self' 'nonce-anewday'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'";

        // Inject CSP if not already present
        if (!html.includes('Content-Security-Policy')) {
          html = html.replace(
            /<meta name="theme-color"/,
            `<meta http-equiv="Content-Security-Policy" content="${cspContent}" />\n    <meta name="theme-color"`
          );
        }

        return html;
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
    exclude: ['tests/e2e/**', 'tests/a11y/**', 'node_modules/**'],
  },
});
