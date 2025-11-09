/**
 * IndexedDB helpers for persisting checklist state and performing legacy migrations.
 */

import { dateKey } from './reset';

export interface PersistedState {
  meta: { lastResetKey: string; settings: { mode: 'single' | 'multi' }; migrationVersion?: number };
  lists: Array<{ id: string; name: string }>;
  items: Array<{ id: string; listId: string; title: string; completed: boolean; position: number }>;
}

export interface MigrationResult {
  changed: boolean;
  message?: string;
  error?: string;
}

const DB_NAME = 'anewday';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_LISTS = 'lists';
const STORE_META = 'meta';
const META_KEY = 'singleton';
const MIGRATION_VERSION = 1;
const LEGACY_KEYS = ['todos', 'anewday-items', 'anewday-state'];

let dbInstance: Promise<IDBDatabase> | null = null;
let dbHandle: IDBDatabase | null = null;

/** Opens (or returns) the singleton IndexedDB instance backing the app. */
export function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable in this environment.'));
  }

  if (!dbInstance) {
    dbInstance = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_LISTS)) {
          db.createObjectStore(STORE_LISTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'id' });
        }
        if ((event.oldVersion ?? 0) < 1) {
          request.transaction?.objectStore(STORE_META).put({
            id: META_KEY,
            lastResetKey: dateKey(),
            settings: { mode: 'single' },
            migrationVersion: 0,
          });
        }
      };

      request.onsuccess = () => {
        dbHandle = request.result;
        resolve(dbHandle);
      };
      request.onerror = () => reject(request.error);
    });
  }

  return dbInstance;
}

/** Forces current DB connections closed so tests can start from a clean slate. */
export function closeDbConnectionsForTests() {
  dbHandle?.close();
  dbHandle = null;
  dbInstance = null;
}

/** Loads full persisted state from IndexedDB or returns null when unset. */
export async function loadState(db: IDBDatabase): Promise<PersistedState | null> {
  const tx = db.transaction([STORE_ITEMS, STORE_LISTS, STORE_META], 'readonly');
  const [items, lists, meta] = await Promise.all([
    getAll(tx.objectStore(STORE_ITEMS)),
    getAll(tx.objectStore(STORE_LISTS)),
    getValue(tx.objectStore(STORE_META), META_KEY),
  ]);

  if (!meta) {
    return null;
  }

  // Sort items by position, and assign positions to any items missing them
  const sortedItems = ((items as PersistedState['items']) ?? [])
    .map((item, index) => ({
      ...item,
      position: item.position ?? index,
    }))
    .sort((a, b) => a.position - b.position);

  return {
    meta: meta as PersistedState['meta'],
    lists: (lists as PersistedState['lists']) ?? [],
    items: sortedItems,
  };
}

/** Persists the entire application state atomically. */
export function saveState(db: IDBDatabase, state: PersistedState): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ITEMS, STORE_LISTS, STORE_META], 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    const itemsStore = tx.objectStore(STORE_ITEMS);
    const listsStore = tx.objectStore(STORE_LISTS);
    const metaStore = tx.objectStore(STORE_META);

    itemsStore.clear();
    state.items.forEach((item) => {
      itemsStore.put({ ...item, completed: !!item.completed });
    });

    listsStore.clear();
    state.lists.forEach((list) => listsStore.put(list));

    metaStore.put({
      ...state.meta,
      id: META_KEY,
      migrationVersion: state.meta.migrationVersion ?? MIGRATION_VERSION,
    });
  });
}

/** Migrates legacy localStorage snapshots into IndexedDB, returning status metadata. */
export async function migrateFromLocalStorage(db: IDBDatabase): Promise<MigrationResult> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { changed: false };
  }

  try {
    const metaTx = db.transaction(STORE_META, 'readonly');
    const metaStore = metaTx.objectStore(STORE_META);
    const existing = await getValue<{ migrationVersion?: number }>(metaStore, META_KEY);
    if ((existing?.migrationVersion ?? 0) >= MIGRATION_VERSION) {
      return { changed: false };
    }
  } catch (error) {
    return { changed: false, error: String(error) };
  }

  const legacyKey = LEGACY_KEYS.find((key) => window.localStorage.getItem(key));
  if (!legacyKey) {
    return { changed: false };
  }

  const raw = window.localStorage.getItem(legacyKey);
  if (!raw) {
    return { changed: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { changed: false, error: `Legacy data unreadable: ${String(error)}` };
  }

  type LegacyEntry = {
    id?: string | number;
    description?: string;
    title?: string;
    done?: unknown;
  };

  const itemsArray = Array.isArray(parsed)
    ? (parsed as LegacyEntry[]).map((entry, index) => ({
        id: String(entry?.id ?? `${Date.now()}-${index}`),
        listId: 'today',
        title: String(entry?.description ?? entry?.title ?? '').slice(0, 120),
        completed: Boolean(entry?.done),
        position: index,
      }))
    : [];

  window.localStorage.setItem('anewday-migration-backup', raw);

  return new Promise((resolve) => {
    const tx = db.transaction([STORE_ITEMS, STORE_LISTS, STORE_META], 'readwrite');
    tx.oncomplete = () => resolve({ changed: true, message: 'Data migrated—view export.' });
    tx.onerror = () => {
      window.localStorage.setItem(
        'anewday-migration-error',
        tx.error ? String(tx.error) : 'unknown'
      );
      resolve({ changed: false, error: 'Legacy migration failed.' });
    };

    const itemsStore = tx.objectStore(STORE_ITEMS);
    itemsStore.clear();
    itemsArray.forEach((item) => itemsStore.put(item));

    const listsStore = tx.objectStore(STORE_LISTS);
    listsStore.clear();
    listsStore.put({ id: 'today', name: 'Today' });

    tx.objectStore(STORE_META).put({
      id: META_KEY,
      lastResetKey: dateKey(),
      settings: { mode: 'single' },
      migrationVersion: MIGRATION_VERSION,
    });
  });
}

function getAll<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error);
  });
}

function getValue<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}
