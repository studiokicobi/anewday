import { test, expect } from '@playwright/test';

test('Info & settings menu navigates to detail views', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const settingsTrigger = page.getByRole('button', { name: '→ Info & settings' });
  await settingsTrigger.click();

  const dialog = page.getByRole('dialog', { name: 'Info & settings' });
  await expect(dialog).toBeVisible();

  // Wait for animations/JavaScript to be ready
  await page.waitForTimeout(400);

  const aboutMenuItem = dialog.getByRole('button', { name: 'About' });
  await aboutMenuItem.click();

  // Wait for About page and verify content appears
  const aboutDialog = page.getByRole('dialog', { name: 'About' });
  await expect(aboutDialog.getByRole('heading', { name: 'What is A New Day?' })).toBeVisible();

  // Navigate back to menu
  await aboutDialog.getByRole('button', { name: '← Info & settings' }).click();
  await expect(dialog.getByRole('button', { name: 'About' })).toBeVisible();
});
