import { test, expect, type Page } from '@playwright/test';

/**
 * The store is interactive before initState() has read IndexedDB, so a task can
 * be submitted while the load is still in flight. Delaying the delivery of the
 * load's reads makes that window wide enough to hit reliably. `getAll` is only
 * used by loadState(); saveState() uses put/clear and the legacy migration uses
 * get, so writes still run at full speed.
 */
const DEFERRED_READ_MS = 1200;

async function deferInitialLoad(page: Page) {
  await page.addInitScript((delay: number) => {
    const original = IDBObjectStore.prototype.getAll;
    // `onsuccess` is an IDL event handler, so shadowing it outright would stop
    // the browser registering any listener. Intercept the assignment, then hand
    // a deferred wrapper to the real setter.
    const assignOnSuccess = Object.getOwnPropertyDescriptor(
      IDBRequest.prototype,
      'onsuccess'
    )!.set!;
    let deferrals = 2; // loadState() reads the items and lists stores
    (window as unknown as { __deferredReads: number }).__deferredReads = 0;

    IDBObjectStore.prototype.getAll = function (this: IDBObjectStore, ...args: unknown[]) {
      const request = (original as (...a: unknown[]) => IDBRequest).apply(this, args);
      if (deferrals-- > 0) {
        let handler: ((event: Event) => void) | null = null;
        Object.defineProperty(request, 'onsuccess', {
          configurable: true,
          get: () => handler,
          set: (fn: (event: Event) => void) => {
            handler = fn;
            assignOnSuccess.call(request, (event: Event) => {
              setTimeout(() => {
                (window as unknown as { __deferredReads: number }).__deferredReads += 1;
                fn.call(request, event);
              }, delay);
            });
          },
        });
      }
      return request;
    } as typeof original;
  }, DEFERRED_READ_MS);
}

function persistedTitles(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open('anewday');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const read = db.transaction('items', 'readonly').objectStore('items').getAll();
          read.onerror = () => reject(read.error);
          read.onsuccess = () => {
            resolve((read.result as Array<{ title: string }>).map((item) => item.title).sort());
            db.close();
          };
        };
      })
  );
}

test('keeps a task added while the initial load is still in flight', async ({ page }) => {
  // First visit, at full speed: leave a task behind the way a previous session would.
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.fill('input[name="task"]', 'Saved earlier');
  await page.click('button:has-text("Add")');
  await expect.poll(() => persistedTitles(page)).toEqual(['Saved earlier']);

  // Second visit, with the load held open: add a task before it publishes.
  await deferInitialLoad(page);
  await page.reload();
  await page.fill('input[name="task"]', 'Typed while loading');
  await page.click('button:has-text("Add")');
  await expect(page.getByRole('checkbox', { name: 'Typed while loading' })).toBeVisible();

  // Let the load land, then give its write-back time to run.
  await page.waitForFunction(
    () => (window as unknown as { __deferredReads: number }).__deferredReads >= 2
  );
  await page.waitForTimeout(500);

  await expect(page.getByRole('checkbox', { name: 'Saved earlier' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Typed while loading' })).toBeVisible();
  expect(await persistedTitles(page)).toEqual(['Saved earlier', 'Typed while loading']);
});
