import { test } from '@playwright/test';
import { runA11yAudit } from './axe-helper';

test.describe('A New Day — Accessibility', () => {
  test('home flow is accessible', async ({ page }) => {
    await page.goto('/');
    await runA11yAudit(page, 'home');
    await page.fill('input[name="task"]', 'Brush teeth');
    await page.click('button:has-text("Add")');
    await runA11yAudit(page, 'after add');
  });

  test('keyboard-only can add/toggle/delete', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Stretch');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
  });
});
