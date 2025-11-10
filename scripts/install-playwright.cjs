// scripts/install-playwright.js
const { execSync } = require('child_process');

if (process.env.NETLIFY === 'true' || process.env.CI === 'true' || process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
  console.log('Skipping Playwright browser install in CI/Netlify.');
  process.exit(0);
}

try {
  console.log('Installing Playwright browsers...');
  execSync('npx playwright install --with-deps', { stdio: 'inherit' });
} catch (err) {
  console.error('Playwright browser install failed:', err);
  process.exit(1);
}
