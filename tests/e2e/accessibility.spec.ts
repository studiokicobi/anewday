import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page meets core axe rules', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).include('#app').analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  await expect(page.locator('h1')).toHaveText('A New Day');
});
