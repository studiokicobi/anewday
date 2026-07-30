import { test, expect } from '@playwright/test';

// Focus restoration around the reset confirmation had no coverage: nothing
// exercised backdrop dismissal, and nothing asserted where focus lands once a
// nested dialog closes over a still-open one.
//
// It matters because focusTrap registers its keydown listener on the dialog
// node rather than on document, so if focus ever settled outside the drawer,
// Escape would silently stop working and a keyboard user would be stranded
// with the drawer open.
//
// Note the poll: focus restoration settles a tick after teardown, and there is
// a brief window where document.activeElement is <body>. A single evaluate()
// right after the click samples that transient and reads as a failure.

async function openYourDataView(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Settings' }).click();
  const settingsDialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(settingsDialog).toBeVisible();

  await settingsDialog.getByRole('button', { name: 'Your data & privacy' }).click();
  const dataDialog = page.getByRole('dialog', { name: 'Your data & privacy' });
  await expect(dataDialog.getByRole('button', { name: 'Reset all data' })).toBeVisible();

  return dataDialog;
}

async function expectFocusSettlesInsideDialog(page: import('@playwright/test').Page) {
  await expect
    .poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))
    .toBe(true);
}

test('cancelling the reset dialog returns focus into the settings drawer', async ({ page }) => {
  const dataDialog = await openYourDataView(page);

  await dataDialog.getByRole('button', { name: 'Reset all data' }).click();

  const resetDialog = page.getByRole('dialog', { name: 'Reset all data' });
  await expect(resetDialog).toBeVisible();

  await resetDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(resetDialog).toBeHidden();

  // The drawer stays open underneath -- cancelling must not close both.
  await expect(page.getByRole('dialog', { name: 'Your data & privacy' })).toBeVisible();

  await expectFocusSettlesInsideDialog(page);

  // With focus restored, Escape reaches the drawer's trap and closes it.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Your data & privacy' })).toBeHidden();
});

// The backdrop is a separate code path (handleOverlayPointerDown) and dismisses
// via pointerdown, which does not move focus the way a button click does.
test('dismissing the reset dialog by backdrop returns focus into the settings drawer', async ({
  page,
}) => {
  const dataDialog = await openYourDataView(page);

  await dataDialog.getByRole('button', { name: 'Reset all data' }).click();

  const resetDialog = page.getByRole('dialog', { name: 'Reset all data' });
  await expect(resetDialog).toBeVisible();

  // Click the backdrop far from the panel, never the confirm button.
  await page.mouse.click(5, 5);
  await expect(resetDialog).toBeHidden();

  await expect(page.getByRole('dialog', { name: 'Your data & privacy' })).toBeVisible();

  await expectFocusSettlesInsideDialog(page);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Your data & privacy' })).toBeHidden();
});
