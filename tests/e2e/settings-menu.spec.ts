import { test, expect } from '@playwright/test';

test('Settings menu navigates to detail views', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const settingsTrigger = page.getByRole('button', { name: 'Settings' });
  await settingsTrigger.click();

  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();

  // Wait for animations/JavaScript to be ready
  await page.waitForTimeout(400);

  const appearanceMenuItem = dialog.getByRole('button', { name: 'Appearance' });
  await appearanceMenuItem.click();

  // Wait for Appearance page and verify content appears
  const appearanceDialog = page.getByRole('dialog', { name: 'Appearance' });
  await expect(appearanceDialog.getByRole('heading', { name: 'Theme' })).toBeVisible();

  // Navigate back to menu using breadcrumb
  await appearanceDialog.getByRole('button', { name: 'Settings' }).click();
  await expect(dialog.getByRole('button', { name: 'Appearance' })).toBeVisible();
});

test('Settings drawer displays About content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const settingsTrigger = page.getByRole('button', { name: 'Settings' });
  await settingsTrigger.click();

  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();

  // Navigate to About sub-view
  await dialog.getByRole('button', { name: 'About' }).click();

  const aboutDialog = page.getByRole('dialog', { name: 'About' });
  await expect(aboutDialog.getByRole('heading', { name: 'What is A New Day?' })).toBeVisible();

  // Navigate back, then to How do I? sub-view
  await aboutDialog.getByRole('button', { name: 'Settings' }).click();
  await dialog.getByRole('button', { name: 'How do I?' }).click();

  const howDoIDialog = page.getByRole('dialog', { name: 'How do I?' });
  await expect(howDoIDialog.getByRole('heading', { name: 'Using A New Day' })).toBeVisible();
});

/*
 * The drawer used to restore focus twice on close: once synchronously from
 * focusTrap's destroy(), and again from a setTimeout 50ms later. The second one
 * landed after the user had already moved on, pulling focus out of whatever they
 * were typing into and swallowing those keystrokes. Its condition was only "the
 * drawer is not open", so it also fired ~50ms after first paint on a page where
 * the drawer had never been opened at all.
 *
 * Both tests below wait out a fixed delay on purpose: they assert that nothing
 * happens afterwards, which cannot be expressed as a poll.
 */
test('Settings drawer leaves focus alone on a page where it was never opened', async ({ page }) => {
  // The stray restoration fired ~50ms after first paint, before a test can
  // realistically take focus itself, so watch for it instead of racing it.
  await page.addInitScript(() => {
    (window as unknown as { __settingsTriggerFocused: boolean }).__settingsTriggerFocused = false;
    document.addEventListener(
      'focusin',
      (event) => {
        if ((event.target as HTMLElement)?.hasAttribute?.('data-settings-trigger')) {
          (window as unknown as { __settingsTriggerFocused: boolean }).__settingsTriggerFocused =
            true;
        }
      },
      true
    );
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  expect(
    await page.evaluate(
      () => (window as unknown as { __settingsTriggerFocused: boolean }).__settingsTriggerFocused
    )
  ).toBe(false);
});

test('Closing the settings drawer returns focus once and then releases it', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const settingsTrigger = page.getByRole('button', { name: 'Settings' });
  await settingsTrigger.click();

  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Close').click();
  await expect(dialog).toBeHidden();
  await expect(settingsTrigger).toBeFocused();

  // Moving on to the task input must stick — nothing may reclaim focus.
  const taskInput = page.getByPlaceholder('Today I will...');
  await taskInput.focus();
  await page.waitForTimeout(300);

  await expect(taskInput).toBeFocused();
});
