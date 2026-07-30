import { test, expect, type Page } from '@playwright/test';

/**
 * The store is interactive before initState() has read IndexedDB, so a task can
 * be submitted while the load is still in flight. To exercise that window we
 * hold back the delivery of the load's reads until the test releases them —
 * an explicit gate rather than a timer, so a slow machine widens the window
 * instead of closing it.
 *
 * `getAll` is only used by loadState(); saveState() uses put/clear and the
 * legacy migration uses get, so writes still run at full speed.
 */
type LoadGate = { __heldReads: number; __releaseLoad?: () => void };

async function holdInitialLoad(page: Page) {
  await page.addInitScript(() => {
    const gate = window as unknown as LoadGate;
    gate.__heldReads = 0;

    const original = IDBObjectStore.prototype.getAll;
    // `onsuccess` is an IDL event handler, so shadowing it outright would stop
    // the browser registering any listener and the load would never resolve.
    // Intercept the assignment, then hand a held wrapper to the real setter.
    const assignOnSuccess = Object.getOwnPropertyDescriptor(
      IDBRequest.prototype,
      'onsuccess'
    )!.set!;

    const held: Array<() => void> = [];
    let released = false;
    gate.__releaseLoad = () => {
      released = true;
      held.splice(0).forEach((deliver) => deliver());
    };

    let remaining = 2; // loadState() reads the items and lists stores
    IDBObjectStore.prototype.getAll = function (this: IDBObjectStore, ...args: unknown[]) {
      const request = (original as (...a: unknown[]) => IDBRequest).apply(this, args);
      if (remaining-- > 0) {
        let handler: ((event: Event) => void) | null = null;
        Object.defineProperty(request, 'onsuccess', {
          configurable: true,
          get: () => handler,
          set: (fn: (event: Event) => void) => {
            handler = fn;
            assignOnSuccess.call(request, (event: Event) => {
              const deliver = () => fn.call(request, event);
              gate.__heldReads += 1;
              if (released) {
                deliver();
              } else {
                held.push(deliver);
              }
            });
          },
        });
      }
      return request;
    } as typeof original;
  });
}

/** Resolves once loadState() has read IndexedDB but is still waiting to publish. */
function waitForHeldLoad(page: Page) {
  return page.waitForFunction(() => (window as unknown as LoadGate).__heldReads >= 2);
}

function releaseHeldLoad(page: Page) {
  return page.evaluate(() => {
    const release = (window as unknown as LoadGate).__releaseLoad;
    if (typeof release !== 'function') {
      throw new Error('load gate missing; the init script did not run on this document');
    }
    release();
  });
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

async function addTask(page: Page, title: string) {
  const taskInput = page.getByLabel('Add an item to your daily checklist');
  // Retry the fill until the value sticks. Occasionally a fill leaves the input
  // empty, and handleFormSubmit() then drops the empty submission silently, so
  // no task ever appears. The cause is not established: a re-render of the form
  // does not discard already-typed text, and flushing the initial render with a
  // double requestAnimationFrame did not help either. Retrying is safe here
  // because the load is pinned open by an explicit gate rather than a timer, so
  // a slow fill cannot close the window this test exercises.
  await expect(async () => {
    await taskInput.fill(title);
    await expect(taskInput).toHaveValue(title, { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Add' }).click();
}

test('keeps a task added while the initial load is still in flight', async ({ page }) => {
  // First visit, at full speed: leave a task behind the way a previous session would.
  await page.goto('/', { waitUntil: 'networkidle' });
  await addTask(page, 'Saved earlier');
  await expect.poll(() => persistedTitles(page)).toEqual(['Saved earlier']);

  // Second visit, with the load pinned open partway through.
  await holdInitialLoad(page);
  await page.reload();
  await waitForHeldLoad(page);

  await addTask(page, 'Typed while loading');
  await expect(page.getByRole('checkbox', { name: 'Typed while loading' })).toBeVisible();

  // Let the load publish. The task must survive in both the DOM and IndexedDB.
  await releaseHeldLoad(page);
  await expect.poll(() => persistedTitles(page)).toEqual(['Saved earlier', 'Typed while loading']);
  await expect(page.getByRole('checkbox', { name: 'Saved earlier' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Typed while loading' })).toBeVisible();
});
