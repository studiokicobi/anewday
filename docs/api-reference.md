# API Reference

## Overview

A New Day is a client-side only application with no backend API. This document describes the internal data structures, IndexedDB schema, and state management for AI tools and developers working with the codebase.

## IndexedDB Schema

### Database: `anewday`

Version: 1

### Object Stores

#### 1. `items` Store

**Key Path:** `id`

**Structure:**

```typescript
interface TodoItem {
  id: string; // UUID v4
  listId: string; // Reference to list ID
  title: string; // Task description
  completed: boolean; // Checkbox state
  position: number; // Display order (0-based index)
}
```

**Indexes:** None

**Example:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "listId": "today",
  "title": "Drink water",
  "completed": false,
  "position": 0
}
```

#### 2. `lists` Store

**Key Path:** `id`

**Structure:**

```typescript
interface List {
  id: string; // List identifier
  name: string; // Display name
}
```

**Default Lists:**

- Single-list mode: `{ id: 'today', name: 'Today' }`
- Multi-list mode: Custom user-defined lists

**Example:**

```json
{
  "id": "today",
  "name": "Today"
}
```

#### 3. `meta` Store

**Key Path:** `id`

**Structure:**

```typescript
interface Meta {
  id: 'singleton'; // Always 'singleton' (single record)
  lastResetKey: string; // Date key for midnight reset (YYYY-MM-DD)
  settings: {
    mode: 'single' | 'multi';
  };
  migrationVersion?: number;
}
```

**Example:**

```json
{
  "id": "singleton",
  "lastResetKey": "2025-11-21",
  "settings": {
    "mode": "single"
  },
  "migrationVersion": 1
}
```

## Svelte State Management

### Global State (`src/stores/state.ts`)

The application uses Svelte writable stores:

```typescript
export const appState: Writable<PersistedState>;

interface PersistedState {
  meta: {
    lastResetKey: string;
    settings: { mode: 'single' | 'multi' };
    migrationVersion?: number;
  };
  lists: Array<{ id: string; name: string }>;
  items: Array<{
    id: string;
    listId: string;
    title: string;
    completed: boolean;
    position: number;
  }>;
}
```

**Exported Types:**

- `List` - Type alias for list objects
- `TodoItem` - Type alias for item objects

**Store Subscriptions:**
Components subscribe using Svelte's `$appState` auto-subscription syntax.

### State Initialization Flow

1. **App Mount** (`main.ts`) → Initializes Svelte app and calls `initState()`
2. **State Init** (`state.ts`) → Opens IndexedDB, loads persisted state
3. **Reset Check** (`reset.ts`) → Checks if midnight reset needed, resets completed flags if new day
4. **Midnight Timer** (`reset.ts`) → Schedules callback for next midnight
5. **Render** → Components subscribe to `appState` changes

## Midnight Reset Mechanism

### Implementation (`src/lib/reset.ts`)

```typescript
export function scheduleReset(callback: () => void): () => void {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  const timeoutId = setTimeout(() => {
    callback();
    // Reschedule for next midnight
    scheduleReset(callback);
  }, msUntilMidnight);

  return () => clearTimeout(timeoutId);
}
```

### Reset Process

1. **Check:** Compare `lastResetDate` to current date
2. **If different:** Reset all `completed` flags to `false`
3. **Update:** Set `lastResetDate` to current date
4. **Persist:** Save to IndexedDB
5. **Schedule:** Set timer for next midnight

## Data Export/Import

### Export Format

```json
{
  "version": "2.0.0",
  "exportDate": "2025-11-21T10:00:00.000Z",
  "encrypted": false,
  "data": {
    "tasks": [...],
    "settings": {...},
    "appState": {...}
  }
}
```

### Encrypted Export

Uses AES-GCM encryption:

```json
{
  "version": "2.0.0",
  "exportDate": "2025-11-21T10:00:00.000Z",
  "encrypted": true,
  "encryptedData": "base64-encoded-ciphertext",
  "iv": "base64-encoded-initialization-vector",
  "salt": "base64-encoded-salt"
}
```

**Encryption Details:**

- Algorithm: AES-GCM
- Key derivation: PBKDF2 with 150,000 iterations
- IV: 12 bytes, randomly generated
- Salt: 16 bytes, randomly generated

## Window Globals

### None

This application does **not** expose any global variables on `window`. All state is managed internally by Svelte.

**Note:** Some dev tools may add temporary globals during development, but these are not part of the production API.

## Component Events

### Custom Events

Components communicate via Svelte's event system:

```typescript
// TodoItem.svelte
dispatch('toggle', { id: task.id });
dispatch('delete', { id: task.id });
dispatch('reorder', { listId: string, tasks: Task[] });

// AddTaskForm.svelte
dispatch('add', { text: string, listId: string });

// SettingsDrawer.svelte
dispatch('close');
dispatch('modeChange', { mode: 'single' | 'multi' });
```

## Service Worker API

### Registration (`src/main.ts`)

```typescript
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Skip Waiting Message

```typescript
// Tell service worker to skip waiting and take control immediately
newWorker.postMessage({ type: 'SKIP_WAITING' });
```

## Migration Strategy

### Adding New Fields

When adding fields to existing data structures:

1. **Add optional field:**

   ```typescript
   interface Task {
     // ...existing fields
     newField?: string; // Optional for backward compatibility
   }
   ```

2. **Provide default during read:**

   ```typescript
   const tasks = await getAllTasks();
   return tasks.map((task) => ({
     ...task,
     newField: task.newField ?? 'default-value',
   }));
   ```

3. **No explicit migration:** Users upgrading will have `undefined` for new fields, which is handled by defaults

### Removing Fields

1. **Mark as deprecated** (add comment)
2. **Stop writing** to the field
3. **Continue reading** for backward compatibility
4. **Remove after major version bump**

## Testing Utilities

### Fake IndexedDB (`tests/unit/setup.ts`)

```typescript
import 'fake-indexeddb/auto';

// Automatically used in Vitest tests
// Provides in-memory IndexedDB for unit tests
```

### Test Helpers

```typescript
// Create test task
function createTestTask(overrides?: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    listId: 'default',
    text: 'Test task',
    completed: false,
    order: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}
```

## Data Flow Diagram

```
User Action
    ↓
Component Event
    ↓
State Update ($state)
    ↓
Reactive Effect ($effect)
    ↓
IndexedDB Write (db.ts)
    ↓
Persistence ✓
```

## Common Operations

### Adding a Task

```typescript
const newTask: Task = {
  id: crypto.randomUUID(),
  listId: activeListId,
  text: userInput,
  completed: false,
  order: tasks.length,
  createdAt: Date.now(),
};

tasks = [...tasks, newTask]; // Triggers $effect → IndexedDB
```

### Toggling Completion

```typescript
const index = tasks.findIndex((t) => t.id === taskId);
tasks[index].completed = !tasks[index].completed;
tasks = [...tasks]; // Trigger reactivity
```

### Reordering via Drag & Drop

```typescript
function handleReorder(listId: string, newOrder: Task[]) {
  // Update order property
  const reordered = newOrder.map((task, index) => ({
    ...task,
    order: index,
  }));

  // Update tasks array
  tasks = tasks
    .filter((t) => t.listId !== listId)
    .concat(reordered)
    .sort((a, b) => a.order - b.order);
}
```

## Error Handling

### IndexedDB Errors

All IndexedDB operations are wrapped in try-catch:

```typescript
try {
  await db.addTask(task);
} catch (error) {
  console.error('Failed to save task:', error);
  // User sees no error message (fail silently)
  // Data remains in memory until next successful save
}
```

**Philosophy:** Silent failures preferred over error dialogs for simple checklist app

## Security Considerations

- **No SQL injection:** IndexedDB is object-based, not SQL
- **No XSS:** All user input is rendered as text, not HTML
- **No CSRF:** No backend API to target
- **Data isolation:** Each origin has separate IndexedDB database

## Performance Notes

- **Batch updates:** Multiple state changes in same tick are batched
- **Lazy loading:** Components only loaded when needed
- **IndexedDB async:** All DB operations are non-blocking
- **Service worker caching:** Assets cached for instant offline load

---

Last updated: November 2025
Current version: 2.0.0
