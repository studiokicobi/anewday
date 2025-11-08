import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  openDB,
  saveState,
  loadState,
  migrateFromLocalStorage,
  type PersistedState,
} from '../../src/lib/db';
import { dateKey } from '../../src/lib/reset';

const DB_NAME = 'anewday';

function clearDatabase() {
  return new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await clearDatabase();
  localStorage.clear();
});

afterEach(async () => {
  await clearDatabase();
});

describe('lib/db', () => {
  it('saves and loads persisted state', async () => {
    const db = await openDB();
    const snapshot: PersistedState = {
      meta: { lastResetKey: dateKey(), settings: { mode: 'single' }, migrationVersion: 1 },
      lists: [{ id: 'today', name: 'Today' }],
      items: [{ id: '1', listId: 'today', title: 'Meditate', completed: false }],
    };

    await saveState(db, snapshot);
    const loaded = await loadState(db);
    db.close();

    expect(loaded?.items).toEqual(snapshot.items);
    expect(loaded?.lists).toEqual(snapshot.lists);
    expect(loaded?.meta.lastResetKey).toBe(snapshot.meta.lastResetKey);
    expect(loaded?.meta.settings.mode).toBe('single');
    expect(loaded?.meta.migrationVersion).toBe(1);
  });

  it('migrates legacy localStorage payloads into IndexedDB schema', async () => {
    localStorage.setItem(
      'todos',
      JSON.stringify([
        { id: 7, description: 'Stretch', done: true },
        { id: 8, description: 'Hydrate', done: false },
      ])
    );

    type StoreValue = { id: string; [key: string]: unknown };

    const stores: Record<'items' | 'lists' | 'meta', Map<string, StoreValue>> = {
      items: new Map(),
      lists: new Map(),
      meta: new Map(),
    };

    const createRequest = <T>(value: T) => {
      const request = { result: value, onsuccess: null, onerror: null } as unknown as IDBRequest<T>;
      queueMicrotask(() => {
        request.onsuccess?.call(request, new Event('success'));
      });
      return request;
    };

    const createObjectStore = (bucket: Map<string, StoreValue>) =>
      ({
        clear: () => {
          bucket.clear();
          return createRequest<StoreValue | undefined>(undefined);
        },
        put: (value: StoreValue) => {
          bucket.set(value.id, value);
          return createRequest(value);
        },
        get: (key: string) => createRequest(bucket.get(String(key))),
      }) as unknown as IDBObjectStore;

    const mockDb = {
      transaction(storeNames: string[] | DOMStringList | string) {
        const names = Array.isArray(storeNames)
          ? storeNames
          : typeof storeNames === 'string'
            ? [storeNames]
            : Array.from(
                { length: (storeNames as DOMStringList).length },
                (_, index) => (storeNames as DOMStringList).item(index) ?? ''
              );
        const objectStores = Object.fromEntries(
          names.map((name) => [name, createObjectStore(stores[name as keyof typeof stores])])
        );
        const tx = {
          objectStore: (name: string) => objectStores[name],
          oncomplete: null,
          onerror: null,
        } as unknown as IDBTransaction;
        queueMicrotask(() => {
          tx.oncomplete?.call(tx, new Event('complete'));
        });
        return tx;
      },
    } as IDBDatabase;

    const result = await migrateFromLocalStorage(mockDb);
    expect(result.changed).toBe(true);

    const migratedItems = Array.from(stores.items.values()) as PersistedState['items'];
    expect(migratedItems).toHaveLength(2);
    expect(migratedItems[0]?.title).toBe('Stretch');
    const migratedMeta = stores.meta.get('singleton') as
      | (PersistedState['meta'] & { id: string })
      | undefined;
    expect(migratedMeta?.migrationVersion).toBe(1);
  });
});
