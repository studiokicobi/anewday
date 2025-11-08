import { test, expect } from '@playwright/test';

test('keyboard flow allows selecting list, submitting, and toggling tasks', async ({ page }) => {
  await page.goto('/');

  // Ensure multi-list mode is enabled so the embedded list selector appears.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'List Organization' }).click();

  const listModeSwitch = page.getByRole('switch').first();
  if ((await listModeSwitch.getAttribute('aria-checked')) !== 'true') {
    await listModeSwitch.click();
  }

  // Close the settings drawer with the keyboard to mimic user flow.
  await page.keyboard.press('Escape');

  const taskInput = page.getByPlaceholder('Today I will...');
  await taskInput.click();
  await taskInput.fill('Keyboard navigation task');
  // Tab once moves directly to the Add button for quick submission.
  await page.keyboard.press('Tab');
  const addButton = page.getByRole('button', { name: 'Add' });
  await expect(addButton).toBeFocused();

  // Shift+Tab brings focus to the embedded list selector when needed.
  await page.keyboard.press('Shift+Tab');
  const listTrigger = page.locator('#embedded-list-selector');
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

  // Tab to Add (skipping the list), then Shift+Tab back to the selector to pick a list.
  await page.keyboard.press('Tab');
  await expect(addButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(listTrigger).toBeFocused();

  // Open the dropdown again and select the current option with Enter.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(listTrigger).toBeFocused();

  // Tab forward to the Add button and submit the form with Enter.
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
