import { test, expect } from '@playwright/test';

test('keyboard flow allows selecting list, submitting, and toggling tasks', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait for app to be fully loaded (especially important for Firefox/IndexedDB)
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => (window as any).__anewdaySetMode, { timeout: 15000 });

  // Ensure multi-list mode is enabled so the embedded list selector appears.
  await page.evaluate(async () => {
    const helper = (window as any).__anewdaySetMode;
    if (helper) {
      await helper('multi');
    }
  }, { timeout: 15000 });

  await expect(page.getByRole('heading', { name: 'Morning' })).toBeVisible();

  const taskInput = page.getByPlaceholder('Today I will...');
  await taskInput.click();
  await taskInput.fill('Keyboard navigation task');
  const listTrigger = page.locator('#embedded-list-selector');
  const addButton = page.getByRole('button', { name: 'Add' });

  // Tab moves to the embedded list selector so a destination list can be chosen.
  await page.keyboard.press('Tab');
  await expect(listTrigger).toBeFocused();

  // Open the dropdown and ensure the first option receives focus.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  const firstOption = page.getByRole('option').first();
  await expect(firstOption).toBeFocused();

  // Move to the next option and confirm focus follows the arrow key.
  await page.keyboard.press('ArrowDown');
  const secondOption = page.getByRole('option').nth(1);
  await expect(secondOption).toBeFocused();

  // Shift+Tab should close the dropdown and return focus to the task field.
  await page.keyboard.press('Shift+Tab');
  await expect(taskInput).toBeFocused();

  // Tab back to the embedded selector.
  await page.keyboard.press('Tab');
  await expect(listTrigger).toBeFocused();

  // Open the dropdown again and use Tab to move focus directly to the Add button.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(addButton).toBeFocused();

  // Shift+Tab returns focus to the selector to pick a list.
  await page.keyboard.press('Shift+Tab');
  await expect(listTrigger).toBeFocused();

  // Open the dropdown again and select the current option with Enter.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(listTrigger).toBeFocused();

  // Use the dropdown once more to move focus to Add, then submit with Enter.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(addButton).toBeFocused();
  await page.keyboard.press('Enter');

  // The task should be added and the checkbox should be reachable via Tab.
  await expect(taskInput).toHaveValue('');
  await page.keyboard.press('Tab');
  const taskCheckbox = page.getByRole('checkbox', { name: 'Keyboard navigation task' });
  await expect(taskCheckbox).toBeFocused();

  // Space toggles completion state.
  await page.keyboard.press(' ');
  await expect(taskCheckbox).toBeChecked();
});
