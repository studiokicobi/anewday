import { defineConfig, devices } from '@playwright/test';
import { previewPort } from './scripts/preview-port.js';

// Per-checkout port; see scripts/preview-port.js for why. Sharing one across
// checkouts once turned a real 3% flake rate into an apparent 47%, because the
// collisions surface as connection errors that read as test failures.
// PREVIEW_PORT pins one deliberately.
const port = previewPort();
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: 'tests',
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    headless: true,
    baseURL,
    viewport: { width: 1280, height: 720 },
    timezoneId: 'America/New_York',
    // The WebKit failures this suite hits only ever appear on CI, so a local
    // repro is not available to debug from. Keep a trace and a screenshot of
    // whatever did fail; both are written only on failure and cost nothing on a
    // green run.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    // Never adopt a server this run did not start. reuseExistingServer would
    // attach to whatever already answers on the port and test against it
    // silently -- another worktree's dist/, or an unrelated local service that
    // happens to sit in this range. Owning the lifecycle costs about a second
    // per run and turns a port clash into a loud "port already in use" instead
    // of results from the wrong application.
    reuseExistingServer: false,
  },
});
