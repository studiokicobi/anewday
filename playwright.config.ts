import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    timezoneId: 'America/New_York',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
