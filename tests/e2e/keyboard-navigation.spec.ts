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
  // The toggle is the whole point of this helper, so confirm the store actually
  // flipped instead of assuming the click landed.
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await settingsDialog.locator('.breadcrumb-back').click();
  await settingsDialog.getByLabel('Close').click();
  await expect(settingsDialog).toBeHidden({ timeout: 5000 });

  // The list selector is only rendered when there is more than one list, so it is
  // the main view's own proof that multi-list mode is live. Waiting for the
  // drawer to hand focus back also means the close is fully settled before the
  // test starts typing.
  await expect(page.locator('#embedded-list-selector')).toBeVisible();
  await expect(settingsTrigger).toBeFocused();
}

// Ensures core keyboard interactions (type → submit → toggle) work without relying on pointer input.
test('keyboard flow allows submitting and toggling tasks', async ({ page }) => {
  await page.goto('/');

  // The app focuses the task input once initState() has resolved, so this starts
  // the test from a settled page: the load published, the store quiet. Same
  // readiness signal reset-dst.spec.ts uses.
  //
  // It used to do more than that. initState() published the IndexedDB snapshot
  // with a store.set() that discarded whatever was committed while the load was
  // still in flight, so the multi-list toggle and the task below were destroyed
  // and the checkbox never rendered. #54 replaced that with a queue commit()
  // fills during the load and publishSnapshot() replays, so the mutations now
  // survive on their own and this wait no longer guards against losing them.
  const taskInput = page.getByPlaceholder('Today I will...');
  await expect(taskInput).toBeFocused({ timeout: 15_000 });

  await enableMultiListMode(page);

  // A focus move landing mid-fill used to leave Add submitting an empty field,
  // which surfaced ten seconds later as "element(s) not found" on the checkbox,
  // far from its cause. Both deferred moves that could do that are gone now —
  // the drawer's close handoff in #63, the form's post-submit restore in #67 —
  // so this asserts the value rather than waiting for anything. If an input is
  // ever lost again it fails here, with an obvious message.
  await taskInput.focus();
  await taskInput.fill('Keyboard navigation task');
  await expect(taskInput).toHaveValue('Keyboard navigation task');

  await page.getByRole('button', { name: 'Add' }).click();

  // No sleep before this: toBeVisible already waits for the row to render, and
  // the 200ms flip the list runs only animates items that move, not the one just
  // appended.
  const taskCheckbox = page.getByRole('checkbox', { name: 'Keyboard navigation task' });
  await expect(taskCheckbox).toBeVisible({ timeout: 10000 });
  await taskCheckbox.focus();
  await taskCheckbox.press('Space');
  await expect(taskCheckbox).toBeChecked();
});
