import { get, writable, type Writable } from 'svelte/store';
import { dateKey, resetIfNeeded, scheduleMidnight } from '../lib/reset';
import {
  openDB,
  loadState,
  saveState,
  migrateFromLocalStorage,
  closeDbConnectionsForTests,
  type PersistedState,
  type MigrationResult,
} from '../lib/db';
import { decryptExport, encryptExport } from '../lib/crypto';

// Export types for components
export type List = PersistedState['lists'][number];
export type TodoItem = PersistedState['items'][number];

const DEFAULT_LIST = { id: 'today', name: 'Today' };
const MIGRATION_FALLBACK: MigrationResult = { changed: false };

const createInitialState = (): PersistedState => ({
  meta: { lastResetKey: dateKey(), settings: { mode: 'single' }, migrationVersion: 1 },
  lists: [DEFAULT_LIST],
  items: [],
});

const store: Writable<PersistedState> = writable(createInitialState());
export const appState = store;

// Store for midnight reset notifications
const resetNotification = writable<{ timestamp: number } | null>(null);
export const onMidnightReset = resetNotification;

/** Requests persistent storage so browsers avoid purging our IndexedDB data. */
export async function requestPersistence() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    const granted = await navigator.storage.persist();
    console.info('[storage.persist]', granted ? 'granted' : 'denied');
    return granted;
  } catch (error) {
    console.warn('[storage.persist] error', error);
    return false;
  }
}

let db: IDBDatabase | null = null;
let cancelMidnight: (() => void) | null = null;
const hasIndexedDB = typeof indexedDB !== 'undefined';

async function database(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB) {
    return null;
  }
  if (!db) {
    db = await openDB();
  }
  return db;
}

const persist = async (state: PersistedState) => {
  const db = await database();
  if (!db) {
    return;
  }
  await saveState(db, state);
};

const normalizeLists = (state: PersistedState): PersistedState => {
  if (!state.lists.length) {
    return { ...state, lists: [DEFAULT_LIST] };
  }
  return { ...state, lists: sortLists(state.lists) };
};

const targetList = (state: PersistedState, listId?: string) => {
  if (listId && state.lists.some((list) => list.id === listId)) {
    return listId;
  }
  return state.lists[0]?.id ?? DEFAULT_LIST.id;
};

function refreshMidnightTimer() {
  cancelMidnight?.();
  cancelMidnight = scheduleMidnight(async () => {
    await checkForReset('midnight');
    refreshMidnightTimer();
  });
}

export async function initState() {
  let migration: MigrationResult = MIGRATION_FALLBACK;
  try {
    const dbInstance = await database();
    if (dbInstance) {
      migration = await migrateFromLocalStorage(dbInstance);
      const persisted = await loadState(dbInstance);
      const normalized = normalizeLists(resetIfNeeded(persisted ?? createInitialState()));
      store.set(normalized);
      await persist(normalized);
    } else {
      store.set(normalizeLists(resetIfNeeded(createInitialState())));
    }
  } catch (error) {
    store.set(normalizeLists(resetIfNeeded(createInitialState())));
    migration = { changed: false, error: (error as Error).message };
  }
  await requestPersistence();
  refreshMidnightTimer();
  return { migration };
}

export async function checkForReset(source: 'midnight' | 'visibility' = 'visibility') {
  const current = get(store);
  const next = resetIfNeeded(current);
  if (next === current) {
    return false;
  }
  store.set(next);
  await persist(next);

  // Notify subscribers if this was triggered by the midnight timer
  if (source === 'midnight') {
    resetNotification.set({ timestamp: Date.now() });
  }

  return true;
}

async function commit(mutator: (state: PersistedState) => PersistedState) {
  const updated = normalizeLists(mutator(get(store)));
  store.set(updated);
  await persist(updated);
  return updated;
}

export async function addItem(title: string, listId?: string) {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error('Cannot add an empty task.');
  }
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  const next = await commit((state) => {
    const maxPosition = state.items.reduce((max, item) => Math.max(max, item.position), -1);
    return {
      ...state,
      items: [
        ...state.items,
        {
          id,
          listId: targetList(state, listId),
          title: trimmed.slice(0, 120),
          completed: false,
          position: maxPosition + 1,
        },
      ],
    };
  });
  return next.items.find((item) => item.id === id)!;
}

export async function toggleItem(id: string) {
  const next = await commit((state) => ({
    ...state,
    items: state.items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ),
  }));
  return next.items.find((item) => item.id === id)!;
}

export async function deleteItem(id: string) {
  await commit((state) => ({
    ...state,
    items: state.items.filter((item) => item.id !== id),
  }));
}

export async function restoreItem(item: TodoItem) {
  await commit((state) => {
    // Insert the item back at its original position
    const listItems = state.items.filter((i) => i.listId === item.listId);
    const otherItems = state.items.filter((i) => i.listId !== item.listId);

    // Find the correct position to insert the item
    const insertIndex = listItems.findIndex((i) => i.position > item.position);
    const newListItems = [...listItems];

    if (insertIndex === -1) {
      // Insert at the end
      newListItems.push(item);
    } else {
      // Insert at the correct position
      newListItems.splice(insertIndex, 0, item);
    }

    return {
      ...state,
      items: [...otherItems, ...newListItems],
    };
  });
}

export async function exportState(passphrase?: string) {
  const payload = JSON.stringify(get(store));
  if (passphrase && passphrase.trim()) {
    return { encrypted: true as const, data: await encryptExport(payload, passphrase) };
  }
  return { encrypted: false as const, data: payload };
}

export async function importState(raw: string, passphrase?: string) {
  const decoded = passphrase && passphrase.trim() ? await decryptExport(raw, passphrase) : raw;
  const parsed = JSON.parse(decoded) as PersistedState;
  if (!parsed?.meta || !Array.isArray(parsed.items) || !Array.isArray(parsed.lists)) {
    throw new Error('Import payload is invalid.');
  }

  const normalized: PersistedState = normalizeLists({
    meta: {
      ...parsed.meta,
      lastResetKey: parsed.meta.lastResetKey ?? dateKey(),
      settings: parsed.meta.settings ?? { mode: 'single' },
      migrationVersion: parsed.meta.migrationVersion ?? 1,
    },
    lists: parsed.lists.map((list) => ({
      id: String(list.id),
      name: String(list.name || '').slice(0, 60),
    })),
    items: parsed.items.map((item, index) => ({
      id: String(item.id),
      listId: String(item.listId ?? parsed.lists[0]?.id ?? DEFAULT_LIST.id),
      title: String(item.title ?? '').slice(0, 120),
      completed: Boolean(item.completed),
      position: item.position ?? index,
    })),
  });

  const reset = resetIfNeeded(normalized);
  store.set(reset);
  await persist(reset);
  refreshMidnightTimer();
  return reset;
}

export async function updateSettings(settings: PersistedState['meta']['settings']) {
  await commit((state) => ({
    ...state,
    meta: { ...state.meta, settings },
    lists: settings.mode === 'multi' ? ensureMultiLists(state.lists) : [DEFAULT_LIST],
    items:
      settings.mode === 'multi'
        ? state.items.map((item) =>
            item.listId === DEFAULT_LIST.id ? { ...item, listId: 'anytime' } : item
          )
        : state.items.map((item) => ({ ...item, listId: DEFAULT_LIST.id })),
  }));
}

function sortLists(lists: PersistedState['lists']): PersistedState['lists'] {
  const order = ['morning', 'anytime', 'evening', 'today'];
  return lists.sort((a, b) => {
    const aIndex = order.indexOf(a.id);
    const bIndex = order.indexOf(b.id);
    // If both are in the order array, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one is in the order array, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in the order array, maintain original order
    return 0;
  });
}

function ensureMultiLists(lists: PersistedState['lists']) {
  const templates = [
    { id: 'morning', name: 'Morning' },
    { id: 'anytime', name: 'Anytime' },
    { id: 'evening', name: 'Evening' },
  ];
  const present = new Map(lists.map((list) => [list.id, list] as const));
  return sortLists(templates.map((template) => present.get(template.id) ?? template));
}

export async function resetAllData() {
  // Clear the database
  const dbInstance = await database();
  if (dbInstance) {
    const tx = dbInstance.transaction(['items', 'lists', 'meta'], 'readwrite');
    tx.objectStore('items').clear();
    tx.objectStore('lists').clear();
    tx.objectStore('meta').clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Reset the store to initial state
  const initial = createInitialState();
  store.set(initial);

  // Persist the initial state
  if (dbInstance) {
    await saveState(dbInstance, initial);
  }

  // Restart the midnight timer
  refreshMidnightTimer();
}

export function __resetStoreForTests() {
  cancelMidnight?.();
  cancelMidnight = null;
  if (db) {
    db.close();
    db = null;
  }
  closeDbConnectionsForTests();
  store.set(createInitialState());
}
