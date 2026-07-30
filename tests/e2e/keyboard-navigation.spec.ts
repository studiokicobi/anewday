import { test, expect, type Page } from '@playwright/test';

async function enableMultiListMode(page: Page) {
  const settingsTrigger = page.locator('[data-settings-trigger]');
  await settingsTrigger.click();
  const settingsDialog = page
    .locator('[aria-modal="true"]')
    .filter({ has: page.locator('#settings-title') });
  await expect(settingsDialog).toBeVisible({ timeout: 10000 });

  await settingsDialog.getByRole('button', { name: 'List organization' }).click();
  await settingsDialog
    .getByRole('heading', { name: 'List organization' })
    .waitFor({ state: 'visible', timeout: 10000 });
  const toggle = settingsDialog.locator('button[role="switch"]').first();
  if ((await toggle.getAttribute('aria-checked')) !== 'true') {
    await toggle.click();
  }
  await settingsDialog.locator('.breadcrumb-back').click();
  await settingsDialog.getByLabel('Close').click();
  await expect(settingsDialog).toBeHidden({ timeout: 5000 });
}

// Ensures core keyboard interactions (type → submit → toggle) work without relying on pointer input.
test('keyboard flow allows submitting and toggling tasks', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForLoadState('domcontentloaded');
  await enableMultiListMode(page);

  const taskInput = page.getByPlaceholder('Today I will...');
  await taskInput.focus();
  await taskInput.fill('Keyboard navigation task');
  await page.getByRole('button', { name: 'Add' }).click();

  // Wait for task to be added and rendered
  await page.waitForTimeout(100);

  const taskCheckbox = page.getByRole('checkbox', { name: 'Keyboard navigation task' });
  await expect(taskCheckbox).toBeVisible({ timeout: 10000 });
  // Wait for slide transition to complete (200ms)
  await page.waitForTimeout(250);
  await taskCheckbox.focus();
  await taskCheckbox.press('Space');
  await expect(taskCheckbox).toBeChecked();
});
