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
