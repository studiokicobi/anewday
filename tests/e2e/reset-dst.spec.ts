import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/New_York' });

test('resets across local midnight and after sleep/wake', async ({ page }) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    let offset = 0;
    function MockDate(this: any, ...args: any[]) {
      if (args.length) {
        return new (RealDate as any)(...args);
      }
      return new RealDate(RealDate.now() + offset);
    }
    MockDate.now = () => RealDate.now() + offset;
    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    MockDate.prototype = RealDate.prototype;
    // @ts-expect-error override Date constructor for test clock
    window.Date = MockDate;
    // @ts-expect-error attach helper for test clock control
    window.__advanceMs = (ms: number) => {
      offset += ms;
    };
  });

  await page.goto('/');
  await page.fill('input[name="task"]', 'DST check');
  await page.click('button:has-text("Add")');
  const checkbox = page.getByRole('checkbox', { name: 'DST check' });
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  await page.evaluate(() => (window as any).__advanceMs(23 * 60 * 60 * 1000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.evaluate(() => (window as any).__advanceMs(2 * 60 * 60 * 1000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText(/New day/i);
});
