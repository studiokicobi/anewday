import { get, writable, type Writable } from 'svelte/store';
import { dateKey, resetIfNeeded, scheduleMidnight } from '../lib/reset';
import {
  openDB,
  loadState,
  saveState,
  migrateFromLocalStorage,
  closeDbConnectionsForTests,
  STORE_ITEMS,
  STORE_LISTS,
  STORE_META,
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

type Mutator = (state: PersistedState) => PersistedState;

// The store is interactive from the first paint, so a task can be added before
// initState() has finished reading IndexedDB. In that window the store still
// holds the empty placeholder state: persisting a mutation derived from it would
// erase the data being loaded, and publishing the loaded snapshot would erase
// the mutation. Mutations made while `loaded` is false are therefore queued and
// replayed onto the loaded snapshot instead of written straight through.
let loaded = true;
let pendingMutations: Mutator[] = [];
let loadedSignal: Promise<void> = Promise.resolve();
let releaseLoaded: (() => void) | null = null;

function beginLoad() {
  releaseLoaded?.();
  loaded = false;
  pendingMutations = [];
  loadedSignal = new Promise((resolve) => {
    releaseLoaded = resolve;
  });
}

function finishLoad() {
  releaseLoaded?.();
  releaseLoaded = null;
}

/**
 * Publishes the persisted snapshot, replaying anything the user changed while
 * the load was in flight. Deliberately synchronous — nothing may run between
 * draining the queue and clearing the flag, or a mutation would slip through
 * unqueued and unpersisted.
 */
function publishSnapshot(base: PersistedState): PersistedState {
  if (loaded) {
    return get(store);
  }
  const next = pendingMutations.reduce(
    (state, mutate) => normalizeLists(mutate(state)),
    normalizeLists(resetIfNeeded(base))
  );
  pendingMutations = [];
  loaded = true;
  store.set(next);
  return next;
}

/** Resolves once the persisted snapshot has been published and written back. */
const whenLoaded = () => (loaded ? Promise.resolve() : loadedSignal);

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
  beginLoad();
  let migration: MigrationResult = MIGRATION_FALLBACK;
  try {
    const dbInstance = await database();
    if (dbInstance) {
      migration = await migrateFromLocalStorage(dbInstance);
      const persisted = await loadState(dbInstance);
      await persist(publishSnapshot(persisted ?? createInitialState()));
    } else {
      publishSnapshot(createInitialState());
    }
  } catch (error) {
    // No persist on this path on purpose: the load failed, so we do not know
    // what IndexedDB already holds and writing the placeholder over it would
    // destroy it.
    publishSnapshot(createInitialState());
    migration = { changed: false, error: (error as Error).message };
  } finally {
    finishLoad();
  }
  // Fire-and-forget: the result is unused, and in Firefox the promise never settles
  // (it waits on a storage permission prompt), which would leave the midnight timer
  // unscheduled and initState() pending forever.
  void requestPersistence();
  refreshMidnightTimer();
  return { migration };
}

export async function checkForReset(source: 'midnight' | 'visibility' = 'visibility') {
  await whenLoaded();
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

async function commit(mutator: Mutator) {
  const updated = normalizeLists(mutator(get(store)));
  store.set(updated);

  if (!loaded) {
    // Show the change straight away, but let publishSnapshot() replay it onto
    // the real snapshot instead of persisting this partial one.
    pendingMutations.push(mutator);
    await whenLoaded();
    return get(store);
  }

  await persist(updated);
  return updated;
}

/**
 * For mutations that carry an explicit item list rather than deriving one from
 * the state they are given — replaying those onto the loaded snapshot would drop
 * the items they never saw. Waiting costs nothing in practice: the drag handles
 * they come from only exist once items are on screen.
 */
async function commitAfterLoad(mutator: Mutator) {
  await whenLoaded();
  return commit(mutator);
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
          title: trimmed.slice(0, 240),
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

export async function updateItemsOrder(listId: string, newItems: TodoItem[]) {
  await commitAfterLoad((state) => {
    const otherItems = state.items.filter((item) => item.listId !== listId);
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      position: index,
      listId,
    }));
    return {
      ...state,
      items: [...otherItems, ...reorderedItems],
    };
  });
}

export async function moveItemBetweenLists(
  sourceListId: string,
  targetListId: string,
  sourceItems: TodoItem[],
  targetItems: TodoItem[]
) {
  await commitAfterLoad((state) => {
    const otherItems = state.items.filter(
      (item) => item.listId !== sourceListId && item.listId !== targetListId
    );

    const updatedSourceItems = sourceItems.map((item, index) => ({
      ...item,
      position: index,
      listId: sourceListId,
    }));

    const updatedTargetItems = targetItems.map((item, index) => ({
      ...item,
      position: index,
      listId: targetListId,
    }));

    return {
      ...state,
      items: [...otherItems, ...updatedSourceItems, ...updatedTargetItems],
    };
  });
}

export async function exportState(passphrase?: string) {
  await whenLoaded();
  const payload = JSON.stringify(get(store));
  if (passphrase && passphrase.trim()) {
    return { encrypted: true as const, data: await encryptExport(payload, passphrase) };
  }
  return { encrypted: false as const, data: payload };
}

export async function importState(raw: string, passphrase?: string) {
  await whenLoaded();
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
      title: String(item.title ?? '').slice(0, 240),
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
  return [...lists].sort((a, b) => {
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
  // Wait for any in-flight load, otherwise it would write the data we just
  // cleared straight back into IndexedDB.
  await whenLoaded();

  // Clear the database
  const dbInstance = await database();
  if (dbInstance) {
    const tx = dbInstance.transaction([STORE_ITEMS, STORE_LISTS, STORE_META], 'readwrite');
    tx.objectStore(STORE_ITEMS).clear();
    tx.objectStore(STORE_LISTS).clear();
    tx.objectStore(STORE_META).clear();

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
  finishLoad();
  loaded = true;
  pendingMutations = [];
  cancelMidnight?.();
  cancelMidnight = null;
  if (db) {
    db.close();
    db = null;
  }
  closeDbConnectionsForTests();
  store.set(createInitialState());
}
