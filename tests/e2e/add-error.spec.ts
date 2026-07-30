import { test, expect, type Page } from '@playwright/test';

/**
 * A failed Add has to explain itself next to the field that caused it. It used
 * to be written to state that only renders inside the settings drawer, so from
 * the main screen the task simply never appeared and nothing said why.
 *
 * Forcing a real failure needs the write to fail, so stub out the items store's
 * `put` to throw. saveState() is the only caller.
 */
function breakTaskWrites(page: Page) {
  // After the app has loaded, so only the Add is affected and startup is left
  // exactly as it normally runs.
  return page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: unknown[]) {
      if (this.name === 'items') {
        throw new Error('Storage is full.');
      }
      return (original as (...a: unknown[]) => IDBRequest).apply(this, args);
    } as typeof original;
  });
}

test('a failed Add explains itself next to the field', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await breakTaskWrites(page);

  const taskInput = page.getByLabel('Add an item to your daily checklist');
  await expect(async () => {
    await taskInput.fill('Buy milk');
    await expect(taskInput).toHaveValue('Buy milk', { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Add' }).click();

  // The reason shows on the main screen, not behind the settings drawer.
  const error = page.locator('#task-error');
  await expect(error).toBeVisible();
  await expect(error).toHaveText('Storage is full.');
  await expect(taskInput).toHaveAttribute('aria-invalid', 'true');
  await expect(taskInput).toHaveAttribute('aria-describedby', 'task-error');

  // The typed text survives, so the user can retry without retyping it.
  await expect(taskInput).toHaveValue('Buy milk');

  // Typing again clears the error rather than leaving it stale.
  await taskInput.fill('Buy oat milk');
  await expect(error).toBeHidden();
});

test('the empty-field warning still works and does not leak the add error', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Add' }).click();

  const error = page.locator('#task-error');
  await expect(error).toBeVisible();
  await expect(error).toHaveText('Please add a task to continue.');
});
