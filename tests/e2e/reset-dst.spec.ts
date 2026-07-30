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

  // The app loads persisted state from IndexedDB asynchronously and overwrites the
  // store when that finishes, so anything added before then is silently discarded.
  // It focuses the task input once that load has resolved — wait for it, otherwise
  // the task below races the load and disappears (flaky on webkit under CI load).
  const taskInput = page.getByLabel('Add an item to your daily checklist');
  await expect(taskInput).toBeFocused({ timeout: 15_000 });

  await taskInput.fill('DST check');
  await page.getByRole('button', { name: 'Add' }).click();

  const checkbox = page.getByRole('checkbox', { name: 'DST check' });
  await expect(checkbox).toBeVisible();
  // `section[aria-live] * { pointer-events: auto !important }` in app.css defeats the
  // checkmark SVG's own pointer-events-none, so the SVG wins the hit test at the
  // checkbox's centre. Real clicks still toggle it (the SVG sits inside the <label>),
  // but Playwright's actionability check rejects it — hence force.
  await checkbox.click({ force: true });
  await expect(checkbox).toBeChecked();

  await page.evaluate(() => (window as any).__advanceMs(23 * 60 * 60 * 1000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.evaluate(() => (window as any).__advanceMs(2 * 60 * 60 * 1000));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText(/New day/i);
});
