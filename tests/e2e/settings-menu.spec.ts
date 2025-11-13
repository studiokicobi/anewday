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

test('About drawer displays content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const aboutTrigger = page.getByRole('button', { name: 'About' });
  await aboutTrigger.click();

  const dialog = page.getByRole('dialog', { name: 'About' });
  await expect(dialog).toBeVisible();

  // Verify About content appears
  await expect(dialog.getByRole('heading', { name: 'What is A New Day?' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Using A New Day' })).toBeVisible();
});
