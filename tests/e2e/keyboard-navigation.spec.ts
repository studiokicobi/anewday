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

// AddTaskForm makes more than one deferred focus move after a submit: one after
// tick(), and the dropdown's restore path sits behind a further 10ms timer.
// Waiting for a single handoff is not enough — a later one lands between
// press()'s internal focus() and its keydown, so Space reaches the Add button
// and the checkbox never toggles. Wait for focus to stop moving instead, which
// holds however many moves the form makes.
async function waitForFocusToSettle(page: Page, quietMs = 150) {
  await page.evaluate(() => {
    const w = window as unknown as { __lastFocusChange?: number; __focusHooked?: boolean };
    w.__lastFocusChange = performance.now();
    if (!w.__focusHooked) {
      w.__focusHooked = true;
      document.addEventListener(
        'focusin',
        () => {
          w.__lastFocusChange = performance.now();
        },
        true
      );
    }
  });
  await page.waitForFunction(
    (ms) =>
      performance.now() -
        ((window as unknown as { __lastFocusChange: number }).__lastFocusChange ?? 0) >=
      ms,
    quietMs
  );
}

// Ensures core keyboard interactions (type → submit → toggle) work without relying on pointer input.
test('keyboard flow allows submitting and toggling tasks', async ({ page }) => {
  await page.goto('/');

  // The store starts from an in-memory placeholder so the UI is interactive from
  // the first paint, and initState() then publishes the IndexedDB snapshot with a
  // store.set() that discards whatever was committed while the load was in
  // flight. Both the multi-list toggle and the task below are such commits, so
  // acting before the load lands silently throws them away and the checkbox never
  // renders. The app focuses the task input once initState() has resolved — wait
  // for that, the same readiness signal PR #53 used for reset-dst.spec.ts.
  // Reproduced by deferring loadState()'s reads past the Add: it yields exactly
  // the "element(s) not found" and 45s-timeout failures CI hits under load.
  const taskInput = page.getByPlaceholder('Today I will...');
  await expect(taskInput).toBeFocused({ timeout: 15_000 });

  await enableMultiListMode(page);

  // Closing the drawer also hands focus back, and that handoff is deferred.
  // Typing into the field while it is still in flight is how CI produced the
  // other failure this test has shown — "element(s) not found" on the checkbox
  // ten seconds later, because Add submitted an empty field and no row was ever
  // created. Settle first, then assert the value actually landed, so a lost
  // input fails here with an obvious message instead of as a phantom missing row.
  await waitForFocusToSettle(page);
  await taskInput.focus();
  await taskInput.fill('Keyboard navigation task');
  await expect(taskInput).toHaveValue('Keyboard navigation task');

  await page.getByRole('button', { name: 'Add' }).click();

  // Let the form finish its post-submit focus choreography before touching the
  // checkbox; see waitForFocusToSettle above for why a single handoff is not a
  // sufficient signal.
  await waitForFocusToSettle(page);

  // No sleep before this: toBeVisible already waits for the row to render, and
  // the 200ms flip the list runs only animates items that move, not the one just
  // appended.
  const taskCheckbox = page.getByRole('checkbox', { name: 'Keyboard navigation task' });
  await expect(taskCheckbox).toBeVisible({ timeout: 10000 });
  await taskCheckbox.focus();
  await taskCheckbox.press('Space');
  await expect(taskCheckbox).toBeChecked();
});
