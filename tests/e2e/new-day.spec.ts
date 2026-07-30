import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalDate = Date;
    let offset = 0;
    function MockDate(this: any, ...args: any[]) {
      if (args.length > 0) {
        return new (OriginalDate as any)(...args);
      }
      return new OriginalDate(OriginalDate.now() + offset);
    }
    MockDate.UTC = OriginalDate.UTC;
    MockDate.parse = OriginalDate.parse;
    MockDate.now = () => OriginalDate.now() + offset;
    MockDate.prototype = OriginalDate.prototype;
    Object.defineProperty(window, 'Date', { value: MockDate });
    (window as any).__advanceDay = () => {
      offset += 24 * 60 * 60 * 1000;
    };
  });
});

test('completes items and auto-resets after simulated midnight', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // The app loads persisted state from IndexedDB asynchronously and publishes it
  // over the store when that finishes. The task input exists from the first paint,
  // so its presence says nothing about readiness; the app focuses it once that
  // load has resolved, so wait for that instead.
  const taskInput = page.getByLabel('Add an item to your daily checklist');
  await expect(taskInput).toBeFocused({ timeout: 15_000 });

  await taskInput.fill('Stretch');
  await page.getByRole('button', { name: 'Add' }).click();
  // Click the label instead of checkbox - works around drag handle zone interference
  await page.getByText('Stretch').click({ force: true });
  const checkbox = page.getByRole('checkbox', { name: 'Stretch' });
  await expect(checkbox).toBeChecked();

  await page.evaluate(() => (window as any).__advanceDay());
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('status')).toContainText('It’s a new day. The list has been reset.');
});
