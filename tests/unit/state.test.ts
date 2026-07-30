import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  initState,
  addItem,
  toggleItem,
  exportState,
  importState,
  updateSettings,
  appState,
  __resetStoreForTests,
} from '../../src/stores/state';
import { dateKey } from '../../src/lib/reset';

/**
 * Holds back the delivery of `getAll` results so a mutation can be landed after
 * loadState() has read IndexedDB but before initState() publishes the snapshot.
 * `getAll` is only used by loadState(); saveState() uses put/clear and the
 * legacy migration uses get, so those still run at full speed.
 */
function gateStateLoad() {
  const original = IDBObjectStore.prototype.getAll;
  let markRead: () => void;
  const read = new Promise<void>((resolve) => {
    markRead = resolve;
  });
  let release: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  IDBObjectStore.prototype.getAll = function (this: IDBObjectStore, ...args: unknown[]) {
    const request = (original as (...a: unknown[]) => IDBRequest).apply(this, args);
    let handler: ((event: Event) => void) | null = null;
    Object.defineProperty(request, 'onsuccess', {
      configurable: true,
      get: () => handler,
      set: (fn: (event: Event) => void) => {
        handler = (event: Event) => {
          markRead();
          void gate.then(() => fn.call(request, event));
        };
      },
    });
    return request;
  } as typeof original;

  return {
    read,
    release: () => release(),
    restore: () => {
      IDBObjectStore.prototype.getAll = original;
    },
  };
}

function clearDatabase() {
  return new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('anewday');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  __resetStoreForTests();
  await clearDatabase();
  window.localStorage.clear();
});

describe('stores/state', () => {
  it('initialises with today list and last reset key', async () => {
    await initState();
    const state = get(appState);
    expect(state.lists[0]?.id).toBe('today');
    expect(state.meta.lastResetKey).toBe(dateKey());
  });

  it('adds and toggles items', async () => {
    await initState();
    const item = await addItem('Walk outside');
    expect(get(appState).items.length).toBe(1);

    const toggled = await toggleItem(item.id);
    expect(toggled.completed).toBe(true);
    expect(get(appState).items[0]?.completed).toBe(true);
  });

  it('exports and re-imports encrypted payloads', async () => {
    await initState();
    await addItem('Journal');

    const { data, encrypted } = await exportState('passphrase');
    expect(encrypted).toBe(true);
    expect(typeof data).toBe('string');

    const state = await importState(data, 'passphrase');
    expect(state.items.length).toBe(1);
    expect(state.items[0]?.title).toBe('Journal');
  });

  it('keeps tasks added while the initial load is still in flight', async () => {
    // Seed IndexedDB as if a previous session had left a task behind.
    await initState();
    await addItem('Saved earlier');
    __resetStoreForTests();

    // The form is interactive before initState() resolves, so a task can be
    // submitted while loadState() is still reading IndexedDB.
    const initialising = initState();
    const added = await addItem('Typed while loading');
    await initialising;

    expect(added.title).toBe('Typed while loading');
    expect(get(appState).items.map((item) => item.title)).toEqual([
      'Saved earlier',
      'Typed while loading',
    ]);

    // ...and it reached IndexedDB, not just the store.
    __resetStoreForTests();
    await initState();
    expect(get(appState).items.map((item) => item.title)).toEqual([
      'Saved earlier',
      'Typed while loading',
    ]);
  });

  it('keeps tasks added after the load has read IndexedDB but before it publishes', async () => {
    await initState();
    await addItem('Saved earlier');
    __resetStoreForTests();

    const load = gateStateLoad();
    try {
      const initialising = initState();
      await load.read;
      const added = addItem('Typed while loading');
      load.release();
      await Promise.all([initialising, added]);
    } finally {
      load.restore();
    }

    expect(get(appState).items.map((item) => item.title)).toEqual([
      'Saved earlier',
      'Typed while loading',
    ]);

    __resetStoreForTests();
    await initState();
    expect(get(appState).items.map((item) => item.title)).toEqual([
      'Saved earlier',
      'Typed while loading',
    ]);
  });

  it('switches between single and multi list modes safely', async () => {
    await initState();
    await addItem('Stretching');

    await updateSettings({ mode: 'multi' });
    let state = get(appState);
    expect(state.lists.map((list) => list.id)).toEqual(['morning', 'anytime', 'evening']);
    expect(state.items[0]?.listId).toBe('anytime');

    await updateSettings({ mode: 'single' });
    state = get(appState);
    expect(state.lists.map((list) => list.id)).toEqual(['today']);
    expect(state.items[0]?.listId).toBe('today');
  });
});
