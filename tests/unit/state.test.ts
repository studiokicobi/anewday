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
  localStorage.clear();
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
