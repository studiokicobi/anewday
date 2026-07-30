<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import AddTaskForm from './components/AddTaskForm.svelte';
  import TodoList from './components/TodoList.svelte';
  import ResetDialog from './components/ResetDialog.svelte';
  import ToastNotification from './components/ToastNotification.svelte';
  import SettingsDrawer from './components/SettingsDrawer.svelte';
  import {
    appState,
    onMidnightReset,
    initState,
    addItem,
    toggleItem,
    deleteItem,
    exportState as exportSnapshot,
    importState as importSnapshot,
    checkForReset,
    updateSettings,
    resetAllData,
    updateItemsOrder,
    moveItemBetweenLists,
    type TodoItem
  } from './stores/state';

  let description = $state('');
  let toast = $state('');
  let selectedList = $state('');
  let encryption = $state(false);
  let passphrase = $state('');
  // Errors surface where the action that caused them lives. importError covers
  // the settings drawer's own actions — import, export, reset — plus the
  // migration report, all of which are read from the drawer. A failed Add has
  // no business there, so it gets its own state and renders against the field.
  let importError = $state('');
  let addError = $state('');
  let showResetConfirm = $state(false);
  let themeMode = $state<'light' | 'dark' | 'system'>('system');
  let showSettingsDrawer = $state(false);
  let settingsButton = $state<HTMLButtonElement | null>(null);
  let resetButton = $state<HTMLButtonElement | null>(null);
  let taskInput = $state<HTMLInputElement | null>(null);
  let previousBodyOverflow = $state<string | null>(null);
  let bodyScrollLockCount = $state(0);

  const clearToast = () => {
    toast = '';
  };

  const handleVisibility = async () => {
    const didReset = await checkForReset();
    if (didReset) {
      announce('It’s a new day. The list has been reset.');
    }
  };

  const announce = (message: string) => {
    toast = message;
  };

  onMount(() => {
    let mounted = true;
    const automationHelpersEnabled =
      import.meta.env.DEV || (typeof navigator !== 'undefined' && navigator.webdriver);

    const initialization = initState()
      .then(({ migration }) => {
        if (!mounted) {
          return;
        }
        if (migration?.message) {
          announce(migration.message);
        }
        if (migration?.error) {
          importError = migration.error;
        }
        // Focus the task input after initialization
        setTimeout(() => {
          if (taskInput) {
            taskInput.focus();
          }
        }, 100);
      })
      .catch(error => {
        if (mounted) {
          importError = (error as Error).message;
        }
      });

    document.addEventListener('visibilitychange', handleVisibility);

    // Subscribe to midnight reset notifications
    const unsubscribeReset = onMidnightReset.subscribe((notification) => {
      if (notification && mounted) {
        announce('It’s a new day. The list has been reset.');
      }
    });

    if (automationHelpersEnabled && typeof window !== 'undefined') {
      window.__anewdayRequestReset = handleVisibility;
      window.__anewdaySetMode = async (mode: 'single' | 'multi') => {
        await initialization;
        await updateSettings({ mode });
      };
    }

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      themeMode = savedTheme;
      setThemeMode(savedTheme);
    }

    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribeReset();
      clearInterval(interval);
      if (automationHelpersEnabled && typeof window !== 'undefined') {
        window.__anewdayRequestReset = undefined;
        window.__anewdaySetMode = undefined;
      }
    };
  });

  let lists = $derived($appState.lists);
  let items = $derived($appState.items);
  let settings = $derived($appState.meta.settings);

  // Ensure selectedList is valid whenever lists change
  $effect(() => {
    if (!lists.some(list => list.id === selectedList)) {
      selectedList = lists[0]?.id ?? '';
    }
  });

  async function handleSubmit() {
    addError = '';
    try {
      await addItem(description, selectedList);
      description = '';
    } catch (error) {
      // Keep what was typed: the text is the thing worth saving, and it is the
      // user's only way to retry without retyping.
      addError = (error as Error).message || 'Could not add that task.';
    }
  }

  async function handleToggle(id: string) {
    await toggleItem(id);
  }

  async function handleDelete(id: string) {
    await deleteItem(id);
  }

  function onToggle(event: CustomEvent<string>) {
    void handleToggle(event.detail);
  }

  function onDelete(event: CustomEvent<string>) {
    void handleDelete(event.detail);
  }

  // Track items per list for drag-and-drop
  let listItems = $derived.by(() => {
    const newListItems: Record<string, TodoItem[]> = {};
    for (const list of lists) {
      newListItems[list.id] = items.filter(item => item.listId === list.id);
    }
    return newListItems;
  });

  // Touch drag state for precise insertion
  let touchDragState = $state<{
    active: boolean;
    sourceItem: TodoItem | null;
    sourceListId: string | null;
    sourceIndex: number | null;
    targetListId: string | null;
    targetIndex: number | null;
  } | null>(null);

  async function handleReorder(event: CustomEvent<{ listId: string; items: TodoItem[] }>) {
    const { listId, items: reorderedItems } = event.detail;
    try {
      await updateItemsOrder(listId, reorderedItems);
    } catch (error) {
      console.error('Error updating items order:', error);
    }
  }

  async function handleMove(event: CustomEvent<{
    sourceListId: string;
    targetListId: string;
    item: TodoItem;
    targetIndex: number;
  }>) {
    const { sourceListId, targetListId, item, targetIndex } = event.detail;

    try {
      // Get current items for both lists
      const sourceItems = listItems[sourceListId].filter(i => i.id !== item.id);
      const targetItems = [...listItems[targetListId]];
      targetItems.splice(targetIndex, 0, item);

      await moveItemBetweenLists(sourceListId, targetListId, sourceItems, targetItems);
    } catch (error) {
      console.error('Error moving item between lists:', error);
    }
  }

  function calculateInsertionPoint(
    clientY: number,
    sourceListId: string
  ): { listId: string; index: number } | null {
    // Find which list the finger is over
    for (const list of lists) {
      const dropZone = document.getElementById(`list-dropzone-${list.id}`);
      if (!dropZone) continue;

      const listRect = dropZone.getBoundingClientRect();
      if (clientY < listRect.top || clientY > listRect.bottom) continue;

      // Finger is over this list - find insertion point
      const items = listItems[list.id] || [];

      // Empty list - insert at position 0
      if (items.length === 0) {
        return { listId: list.id, index: 0 };
      }

      // Find first item whose midline is below clientY
      let targetIndex = items.length; // Default: append to end

      const itemElements = dropZone.querySelectorAll('[role="listitem"]');
      for (let i = 0; i < itemElements.length; i++) {
        const rect = itemElements[i].getBoundingClientRect();
        const midline = rect.top + rect.height / 2;

        if (clientY < midline) {
          targetIndex = i;
          break;
        }
      }

      // Same-list correction: adjust index if dragging within same list
      if (list.id === sourceListId && touchDragState && touchDragState.sourceIndex !== null) {
        const sourceIdx = touchDragState.sourceIndex;
        // If dragging down, subtract 1 (item will be removed from above)
        if (targetIndex > sourceIdx) {
          targetIndex = targetIndex - 1;
        }
      }

      return { listId: list.id, index: targetIndex };
    }

    return null; // Finger not over any list
  }

  function handleTouchDragStart(event: CustomEvent<{
    item: TodoItem;
    sourceIndex: number;
    sourceListId: string;
  }>) {
    const { item, sourceIndex, sourceListId } = event.detail;
    touchDragState = {
      active: true,
      sourceItem: item,
      sourceListId,
      sourceIndex,
      targetListId: null,
      targetIndex: null
    };
  }

  function handleTouchDragOver(event: CustomEvent<{
    clientY: number;
    item: TodoItem;
    sourceIndex: number;
    sourceListId: string;
  }>) {
    if (!touchDragState?.active) return;

    // Guard against mouse drag conflicts
    if (document.querySelector('.dragging')) return;

    const { clientY, sourceListId } = event.detail;
    const target = calculateInsertionPoint(clientY, sourceListId);

    if (target) {
      touchDragState.targetListId = target.listId;
      touchDragState.targetIndex = target.index;
    }
  }

  function handleTouchDragEnd(event: CustomEvent<{
    clientY: number;
    item: TodoItem;
    sourceIndex: number;
    sourceListId: string;
    cancelled?: boolean;
  }>) {
    if (!touchDragState?.active) return;

    const { cancelled } = event.detail;

    if (cancelled) {
      // User cancelled via touchcancel - reset state
      touchDragState = null;
      return;
    }

    const { targetListId, targetIndex, sourceListId } = touchDragState;

    if (targetListId && targetIndex !== null && sourceListId && sourceListId !== targetListId) {
      // Cross-list move - use calculated position
      void handleMove(new CustomEvent('move', {
        detail: {
          sourceListId,
          targetListId,
          item: touchDragState.sourceItem!,
          targetIndex // Use calculated index, not items.length
        }
      }));
    } else if (targetListId && targetIndex !== null && sourceListId && targetListId === sourceListId) {
      // Same-list reorder - use calculated position
      const newItems = [...listItems[sourceListId]];
      const [movedItem] = newItems.splice(touchDragState.sourceIndex!, 1);
      newItems.splice(targetIndex, 0, movedItem);

      void handleReorder(new CustomEvent('reorder', {
        detail: { listId: sourceListId, items: newItems }
      }));
    }

    // Reset state
    touchDragState = null;
  }

  async function handleKeyboardCancel(event: CustomEvent<{
    currentIndex: number;
    currentListId: string;
    originalIndex: number;
    originalListId: string;
    item: TodoItem;
  }>) {
    const { currentListId, originalIndex, originalListId, item } = event.detail;

    // Cross-list cancel - move item back to original list
    try {
      // Remove from current list
      const currentItems = listItems[currentListId].filter(i => i.id !== item.id);

      // Add back to original list at original position
      const originalItems = [...listItems[originalListId]];
      originalItems.splice(originalIndex, 0, item);

      await moveItemBetweenLists(currentListId, originalListId, currentItems, originalItems);
    } catch (error) {
      console.error('Error canceling cross-list move:', error);
    }
  }

  async function handleExport() {
    const result = await exportSnapshot(encryption ? passphrase : undefined);
    const blob = new Blob([result.data], { type: 'application/json' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `anewday-${timestamp}${result.encrypted ? '-encrypted' : ''}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    announce(result.encrypted ? 'Encrypted export saved.' : 'Export saved.');
    passphrase = '';
    encryption = false;
  }

  async function handleImport(files: FileList | null) {
    if (!files?.length) return;
    const text = await files[0].text();
    try {
      await importSnapshot(text, encryption ? passphrase : undefined);
      announce('Import successful.');
      importError = '';
      passphrase = '';
      encryption = false;
    } catch (error) {
      importError = (error as Error).message || 'Import failed. Check file and passphrase.';
    }
  }

  async function toggleMode() {
    const nextMode = settings.mode === 'single' ? 'multi' : 'single';
    await updateSettings({ mode: nextMode });
  }

  // Reactive current time for date/greeting updates
  let currentTime = new Date();


  function getCurrentDate(time: Date = currentTime): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const formattedDate = time.toLocaleDateString('en-US', options);
    return formattedDate;
  }

  async function handleReset() {
    try {
      await resetAllData();
      closeResetConfirm();
      announce('All data has been reset to default state.');
    } catch (error) {
      importError = (error as Error).message || 'Failed to reset data.';
    }
  }

  function openResetConfirm() {
    showResetConfirm = true;
    lockBodyScroll();
  }

  function closeResetConfirm() {
    if (!showResetConfirm) {
      return;
    }
    showResetConfirm = false;
    unlockBodyScroll();
  }

  function lockBodyScroll() {
    if (typeof document === 'undefined') {
      return;
    }
    if (bodyScrollLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    bodyScrollLockCount += 1;
  }

  function unlockBodyScroll() {
    if (typeof document === 'undefined' || bodyScrollLockCount === 0) {
      return;
    }
    bodyScrollLockCount -= 1;
    if (bodyScrollLockCount === 0) {
      if (previousBodyOverflow) {
        document.body.style.overflow = previousBodyOverflow;
      } else {
        document.body.style.removeProperty('overflow');
      }
      previousBodyOverflow = null;
    }
  }

  function openSettingsDrawer() {
    showSettingsDrawer = true;
    lockBodyScroll();
  }

  function closeSettingsDrawer() {
    closeResetConfirm();
    showSettingsDrawer = false;
    unlockBodyScroll();
  }

  function setThemeMode(mode: 'light' | 'dark' | 'system') {
    themeMode = mode;
    // Apply theme to document
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System mode - use media query
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Store preference in localStorage
    localStorage.setItem('themeMode', mode);
  }

  onDestroy(() => {
    while (bodyScrollLockCount > 0) {
      unlockBodyScroll();
    }
  });
</script>

<main
  id="main"
  class="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-6 pb-8"
  aria-label="Main application"
>

  <div class="grow flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-3xl font-semibold tracking-[-0.04em] text-brand-900 dark:text-brand-200">A New Day</h1>
      <p class="text-xs uppercase text-brand-400 dark:text-brand-300 tracking-wide">{getCurrentDate()}</p>
      <p class="hidden text-base text-brand-900 dark:text-brand-100">Daily checklist designed for rebuilding routines. Tasks reset automatically at local midnight.</p>
    </header>

    <AddTaskForm
      bind:description
      {lists}
      bind:selectedList
      bind:taskInput
      bind:submitError={addError}
      onSubmit={handleSubmit}
    />

  {#each lists as list (list.id)}
    <TodoList
      {list}
      items={listItems[list.id] || []}
      on:toggle={onToggle}
      on:delete={onDelete}
      on:reorder={handleReorder}
      on:move={handleMove}
      on:touchdragstart={handleTouchDragStart}
      on:touchdragover={handleTouchDragOver}
      on:touchdragend={handleTouchDragEnd}
      on:keyboardcancel={handleKeyboardCancel}
    />
  {/each}

  <div class="mt-auto mx-auto">
    <div class="flex items-center gap-2 text-sm ">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-brand-500 dark:text-brand-300 bg-brand-100 dark:bg-brand-800 hover:bg-brand-200/50 dark:hover:bg-brand-600 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500"
        onclick={openSettingsDrawer}
        bind:this={settingsButton}
        aria-haspopup="dialog"
        aria-expanded={showSettingsDrawer}
        data-settings-trigger
      >
        <svg class="text-brand-500/50 dark:text-brand-400" width="16" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM2.17 2a3.001 3.001 0 0 1 5.66 0H15a1 1 0 1 1 0 2H7.83a3.001 3.001 0 0 1-5.66 0H1a1 1 0 0 1 0-2h1.17zM11 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM8.17 8a3.001 3.001 0 0 1 5.66 0H15a1 1 0 1 1 0 2h-1.17a3.001 3.001 0 0 1-5.66 0H1a1 1 0 1 1 0-2h7.17zM5 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2.83 0a3.001 3.001 0 0 1 5.66 0H15a1 1 0 1 1 0 2H7.83a3.001 3.001 0 0 1-5.66 0H1a1 1 0 1 1 0-2h1.17z" fill="currentColor"/></svg>
        Settings
      </button>
    </div>
  </div>
  </div>

</main>

<!-- Settings drawer -->
<SettingsDrawer
  showSettings={showSettingsDrawer}
  onClose={closeSettingsDrawer}
  returnFocusElement={settingsButton}
  {themeMode}
  {setThemeMode}
  {toggleMode}
  settingsMode={settings.mode}
  onExport={handleExport}
  onImport={handleImport}
  onOpenResetConfirm={openResetConfirm}
  bind:encryption
  bind:passphrase
  bind:importError
  bind:resetButton
/>

<!-- Reset confirmation dialog -->
{#if showResetConfirm}
  <ResetDialog
    onConfirm={handleReset}
    onCancel={closeResetConfirm}
    returnFocusElement={resetButton}
  />
{/if}

<!-- Toast notifications -->
<ToastNotification
  message={toast}
  onDismiss={toast ? clearToast : null}
/>
