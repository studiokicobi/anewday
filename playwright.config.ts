import { createHash } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

// Every checkout gets its own preview port, derived from its path.
//
// Agent worktrees are full checkouts nested inside the repo, so several copies
// of this suite can run at once. On a shared port they served each other's
// dist/ and tore each other's server down mid-run, which surfaces as
// `page.goto: net::ERR_CONNECTION_REFUSED` and reads as a test failure. It is
// not subtle when it happens -- it once turned a real 3% flake rate into an
// apparent 47% -- but it is easy to misread as the app being broken.
//
// CI has a single checkout, so it keeps the well-known port. PLAYWRIGHT_PORT
// overrides both, for pinning a port deliberately.
const BASE_PORT = 4173;
const PORT_SPREAD = 200; // 4173-4372, clear of vite's 5173 dev and 5180 in launch.json
const port = process.env.PLAYWRIGHT_PORT
  ? Number(process.env.PLAYWRIGHT_PORT)
  : process.env.CI
    ? BASE_PORT
    : BASE_PORT + (createHash('sha1').update(process.cwd()).digest().readUInt16BE(0) % PORT_SPREAD);

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
