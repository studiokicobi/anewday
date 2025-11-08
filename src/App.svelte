<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import TodoItem from './components/TodoItem.svelte';
  import SettingsDrawer from './components/SettingsDrawer.svelte';
  import { clickOutside } from './lib/clickOutside';
  import { focusTrap } from './lib/focusTrap';
  import { sortable } from './lib/sortable';
  import {
    appState,
    initState,
    addItem,
    toggleItem,
    deleteItem,
    reorderItems,
    moveItemToList,
    exportState as exportSnapshot,
    importState as importSnapshot,
    checkForReset,
    updateSettings,
    resetAllData
  } from './stores/state';

  let description = '';
  let toast = '';
  let selectedList = '';
  let encryption = false;
  let passphrase = '';
  let importError = '';
  let showResetConfirm = false;
  let showDeleteConfirm = false;
  let itemToDelete: string | null = null;
  let deleteButton: HTMLElement | null = null;
  let themeMode: 'light' | 'dark' | 'system' = 'system';
  let showSettingsDrawer = false;
  let settingsButton: HTMLButtonElement | null = null;
  let resetButton: HTMLButtonElement | null = null;
  let previousBodyOverflow: string | null = null;
  let bodyScrollLockCount = 0;

  const clearToast = () => (toast = '');
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  const handleVisibility = async () => {
    const didReset = await checkForReset();
    if (didReset) {
      announce('New day detected—tasks refreshed.');
    }
  };

  const announce = (message: string) => {
    toast = message;
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    if (message) {
      toastTimer = setTimeout(() => {
        clearToast();
        toastTimer = null;
      }, 4000);
    }
  };

  onMount(() => {
    let mounted = true;
    initState()
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
      })
      .catch(error => {
        if (mounted) {
          importError = (error as Error).message;
        }
      });

    document.addEventListener('visibilitychange', handleVisibility);
    if (import.meta.env.DEV) {
      (window as any).__anewdayRequestReset = handleVisibility;
    }

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (import.meta.env.DEV) {
        (window as any).__anewdayRequestReset = undefined;
      }
    };
  });

  $: lists = $appState.lists;
  $: items = $appState.items;
  $: settings = $appState.meta.settings;
  $: selectedList = lists.some(list => list.id === selectedList) ? selectedList : lists[0]?.id ?? '';

  async function handleSubmit() {
    try {
      await addItem(description, selectedList);
      description = '';
      // Restore focus to Add button for better keyboard navigation flow
      await tick();
      addButton?.focus();
    } catch (error) {
      importError = (error as Error).message;
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
    itemToDelete = event.detail;
    deleteButton = (event.target as HTMLElement)?.closest('button');
    showDeleteConfirm = true;
    lockBodyScroll();
  }

  function closeDeleteConfirm() {
    if (!showDeleteConfirm) {
      return;
    }
    showDeleteConfirm = false;
    itemToDelete = null;
    unlockBodyScroll();
  }

  async function confirmDelete() {
    if (itemToDelete) {
      await handleDelete(itemToDelete);
      closeDeleteConfirm();
    }
  }

  function handleDeleteOverlayPointerDown(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      closeDeleteConfirm();
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

  let showDropdown = false;
  let taskInput: HTMLInputElement | null = null;
  let embeddedListTrigger: HTMLButtonElement | null = null;
  let addButton: HTMLButtonElement | null = null;
  let skipEmbeddedListOnShiftTab = false;
  let lastFocusedControl: 'input' | 'add' | 'list' | null = null;

  function isEmbeddedListVisible() {
    return lists.length > 1 && description.trim().length > 0;
  }

  function handleTaskInputFocus() {
    lastFocusedControl = 'input';
    skipEmbeddedListOnShiftTab = false;
  }

  function handleTaskInputKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' && event.altKey && isEmbeddedListVisible()) {
      event.preventDefault();
      void openDropdown();
    }

    // WebKit browsers (Safari, DuckDuckGo) have issues with Tab navigation
    // in forms with absolutely positioned elements, so we handle Tab explicitly
    // Tab always goes to Add button for quick submission
    if (event.key === 'Tab' && !event.shiftKey && addButton) {
      event.preventDefault();
      addButton.focus();
    }
  }

  // Reactive current time for date/greeting updates
  let currentTime = new Date();

  // Update time every minute to refresh date/greeting
  onMount(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      themeMode = savedTheme;
      setThemeMode(savedTheme);
    }

    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  });


  function getCurrentDate(time: Date = currentTime): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const formattedDate = time.toLocaleDateString('en-US', options);
    return `${formattedDate}.`;
  }

  // Track focused list item index for keyboard navigation
  let focusedListIndex = -1;

  function getOptionElement(index: number): HTMLButtonElement | null {
    if (typeof document === 'undefined') {
      return null;
    }
    const list = lists[index];
    if (!list) {
      return null;
    }
    return document.getElementById(`option-${list.id}`) as HTMLButtonElement | null;
  }

  function focusOptionByIndex(index: number) {
    if (index < 0 || index >= lists.length) {
      return;
    }
    focusedListIndex = index;
    const option = getOptionElement(index);
    option?.focus();
  }

  async function openDropdown(initialIndex?: number) {
    if (!lists.length) {
      return;
    }
    showDropdown = true;
    const selectedIndex = lists.findIndex(list => list.id === selectedList);
    const indexToFocus =
      typeof initialIndex === 'number' && initialIndex >= 0
        ? Math.min(initialIndex, lists.length - 1)
        : selectedIndex >= 0
          ? selectedIndex
          : 0;
    await tick();
    focusOptionByIndex(indexToFocus);
  }

  async function closeDropdown({ restoreFocusTo }: { restoreFocusTo?: 'trigger' | 'input' | 'add' } = {}) {
    if (!showDropdown) {
      return;
    }
    showDropdown = false;
    focusedListIndex = -1;
    skipEmbeddedListOnShiftTab = false;

    if (!restoreFocusTo) {
      return;
    }

    await tick();
    // Use setTimeout for more reliable focus restoration across all browsers
    await new Promise(resolve => setTimeout(resolve, 10));
    if (restoreFocusTo === 'trigger') {
      embeddedListTrigger?.focus();
    } else if (restoreFocusTo === 'input') {
      taskInput?.focus();
    } else if (restoreFocusTo === 'add') {
      addButton?.focus();
    }
  }

  async function toggleDropdown() {
    if (showDropdown) {
      await closeDropdown();
    } else {
      await openDropdown();
    }
  }

  function handleAddButtonFocus() {
    skipEmbeddedListOnShiftTab = isEmbeddedListVisible() && lastFocusedControl === 'input';
    lastFocusedControl = 'add';
  }

  function handleAddButtonKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab' && event.shiftKey) {
      if (skipEmbeddedListOnShiftTab && isEmbeddedListVisible()) {
        event.preventDefault();
        skipEmbeddedListOnShiftTab = false;
        embeddedListTrigger?.focus();
        return;
      }

      skipEmbeddedListOnShiftTab = false;
      // WebKit: explicitly handle Shift+Tab back to input
      event.preventDefault();
      taskInput?.focus();
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      skipEmbeddedListOnShiftTab = false;
      // WebKit: explicitly handle Tab forward to next element
      event.preventDefault();
      const firstCheckbox = document.querySelector('input[type="checkbox"]') as HTMLElement;
      if (firstCheckbox) {
        firstCheckbox.focus();
      } else if (settingsButton) {
        settingsButton.focus();
      }
    }
  }

  // Handle keyboard navigation for embedded select
  async function handleEmbeddedSelectKeydown(event: KeyboardEvent) {
    skipEmbeddedListOnShiftTab = false;

    if (event.key === 'Escape' && showDropdown) {
      event.preventDefault();
      await closeDropdown({ restoreFocusTo: 'trigger' });
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (showDropdown && focusedListIndex >= 0) {
        const targetList = lists[focusedListIndex];
        if (targetList) {
          await handleListSelection(targetList.id);
        }
      } else {
        await openDropdown();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (showDropdown) {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const currentIndex = focusedListIndex >= 0 ? focusedListIndex : lists.findIndex(list => list.id === selectedList);
        const nextIndex = Math.min(Math.max((currentIndex >= 0 ? currentIndex : 0) + delta, 0), lists.length - 1);
        focusOptionByIndex(nextIndex);
      } else {
        const indexToFocus = event.key === 'ArrowUp' ? lists.length - 1 : undefined;
        await openDropdown(indexToFocus);
      }
      return;
    }

    // WebKit: Handle Tab navigation when dropdown is not open
    if (event.key === 'Tab' && !showDropdown) {
      if (event.shiftKey) {
        event.preventDefault();
        taskInput?.focus();
      } else {
        event.preventDefault();
        addButton?.focus();
      }
    }
  }

  // Handle keyboard navigation within dropdown options
  async function handleDropdownOptionKeydown(event: KeyboardEvent, listId: string, index: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      await handleListSelection(listId);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = Math.min(Math.max(index + delta, 0), lists.length - 1);
      focusOptionByIndex(nextIndex);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusOptionByIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusOptionByIndex(lists.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      await closeDropdown({ restoreFocusTo: 'trigger' });
      return;
    }

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        event.preventDefault();
        await closeDropdown({ restoreFocusTo: 'input' });
      } else {
        event.preventDefault();
        await closeDropdown({ restoreFocusTo: 'add' });
      }
    }
  }

  // Enhanced list selection with focus management
  async function handleListSelection(listId: string) {
    selectedList = listId;
    await closeDropdown({ restoreFocusTo: 'trigger' });
  }

  // Keyboard shortcuts for drag-and-drop alternative
  // Handle click outside or escape key to close dropdown
  async function handleOutclick() {
    if (showDropdown) {
      await closeDropdown();
    }
  }

  // Handle drag-and-drop within the same list
  function handleSortWithinList(listId: string) {
    return async (evt: any) => {
      if (evt.from === evt.to) {
        // Reordering within the same list
        try {
          await reorderItems(listId, evt.oldIndex, evt.newIndex);
        } catch (error) {
          announce('Failed to reorder task.');
          console.error('Reorder failed:', error);
        }
      }
    };
  }

  // Handle drag-and-drop between different lists (and within the same list in multi-mode)
  async function handleSortBetweenLists(evt: any) {
    const itemId = evt.item.dataset.itemId;
    const newListId = evt.to.dataset.listId;

    if (!itemId || !newListId) {
      return;
    }

    try {
      if (evt.from === evt.to) {
        // Reordering within the same list in multi-mode
        await reorderItems(newListId, evt.oldIndex, evt.newIndex);
      } else {
        // Moving between different lists
        await moveItemToList(itemId, newListId, evt.newIndex);
      }
    } catch (error) {
      announce('Failed to update task order.');
      console.error('Drag operation failed:', error);
    }
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


  // Get the selected list name for display
  $: selectedListName = lists.find(list => list.id === selectedList)?.name || 'Select List';

  function handleResetOverlayPointerDown(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      closeResetConfirm();
    }
  }

  onDestroy(() => {
    while (bodyScrollLockCount > 0) {
      unlockBodyScroll();
    }
  });
</script>

<main
  id="main"
  class="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-6"
  use:clickOutside
  on:outclick={handleOutclick}
  aria-label="Main application"
>

  <header class="flex items-start justify-between gap-4">
    <div class="flex flex-col gap-2">
      <h1 class="text-4xl font-semibold tracking-tight text-brand-800">A New Day</h1>
      <div class="flex flex-col gap-1">
        <p class="text-base text-slate-600">{getCurrentDate()}</p>
      </div>
      <p class="hidden text-base text-slate-600">Daily checklist designed for rebuilding routines. Tasks reset automatically at local midnight.</p>
    </div>
  </header>

  <section class="">
    <form class="flex flex-col gap-4" on:submit|preventDefault={handleSubmit} aria-describedby="disclaimer">
      <fieldset class="border-0 p-0 m-0">
        <legend class="sr-only">Add new task</legend>
        <div class="flex flex-col gap-2">
          <label class="sr-only" for="task">Add an item</label>
        <div class="flex gap-2">
          <!-- Input Group Container -->
          <div class="relative flex-1">

            <!-- Text Input -->
            <input
              id="task"
              name="task"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              class:pr-24={lists.length > 1 && description.trim()}
              type="text"
              bind:value={description}
              bind:this={taskInput}
              on:keydown={handleTaskInputKeydown}
              on:focus={handleTaskInputFocus}
              required
              maxlength="80"
              autocomplete="off"
              placeholder="Today I will..."
              aria-label="Add an item to your daily checklist"
            />

            <!-- Embedded List Selector (only shown when typing and multiple lists exist) -->
            {#if lists.length > 1 && description.trim()}
              <div class="absolute right-2 top-1/2 -translate-y-1/2" style="pointer-events: none;">
                <div class="relative" use:clickOutside on:outclick={handleOutclick}>
                  <label for="embedded-list-selector" class="sr-only">Choose list</label>
                  <button
                    id="embedded-list-selector"
                    type="button"
                    role="combobox"
                    tabindex="-1"
                    style="pointer-events: auto;"
                    class="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[44px]"
                    aria-haspopup="listbox"
                    aria-expanded={showDropdown}
                    aria-controls="embedded-dropdown-listbox"
                    aria-activedescendant={showDropdown && focusedListIndex >= 0 ? `option-${lists[focusedListIndex]?.id}` : undefined}
                    bind:this={embeddedListTrigger}
                    on:click={() => void toggleDropdown()}
                    on:keydown={handleEmbeddedSelectKeydown}
                    on:focus={() => {
                      lastFocusedControl = 'list';
                      skipEmbeddedListOnShiftTab = false;
                    }}
                  >
                    <span class="max-w-12 truncate">{selectedListName}</span>
                    <svg
                      class="h-3 w-3 text-slate-400 transition-transform duration-200"
                      class:rotate-180={showDropdown}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  <!-- Dropdown Menu -->
                  {#if showDropdown}
                    <div
                      id="embedded-dropdown-listbox"
                      class="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                      role="listbox"
                      aria-labelledby="embedded-list-selector"
                    >
                      {#each lists as list, index (list.id)}
                        <button
                          type="button"
                          id="option-{list.id}"
                          class="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                          class:bg-brand-50={list.id === selectedList}
                          class:text-brand-700={list.id === selectedList}
                          class:bg-slate-100={focusedListIndex === index}
                          role="option"
                          aria-selected={list.id === selectedList}
                          tabindex="-1"
                          on:click={async () => await handleListSelection(list.id)}
                          on:keydown={(event) => handleDropdownOptionKeydown(event, list.id, index)}
                          on:focus={() => {
                            focusedListIndex = index;
                            skipEmbeddedListOnShiftTab = false;
                            lastFocusedControl = 'list';
                          }}
                        >
                          <span class="flex-1">{list.name}</span>
                          {#if list.id === selectedList}
                            <svg class="h-3 w-3 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                          {/if}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Add Button -->
          <button
            class="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700"
            type="submit"
            bind:this={addButton}
            on:keydown={handleAddButtonKeydown}
            on:focus={handleAddButtonFocus}
          >
            Add
          </button>
        </div>
        </div>
      </fieldset>
    </form>
  </section>

  {#each lists as list (list.id)}
    {@const listItems = items.filter(item => item.listId === list.id)}
    <section class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-labelledby={`list-${list.id}`}>
      <div class="mb-3">
        <h2 class="text-lg font-semibold text-slate-800" id={`list-${list.id}`}>{list.name}</h2>
      </div>
      {#if listItems.length === 0}
        <div
          class="min-h-[60px] rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-sm text-slate-500"
          data-list-id={list.id}
          use:sortable={{
            group: settings.mode === 'multi' ? 'tasks' : undefined,
            onSort: settings.mode === 'multi' ? handleSortBetweenLists : undefined
          }}
        >
          {settings.mode === 'multi' ? 'Drop tasks here or add one above' : 'No items yet. Add one above.'}
        </div>
      {:else}
        <ul
          class="flex flex-col gap-2"
          aria-live="polite"
          data-list-id={list.id}
          use:sortable={{
            group: settings.mode === 'multi' ? 'tasks' : undefined,
            onSort: settings.mode === 'multi' ? handleSortBetweenLists : handleSortWithinList(list.id)
          }}
        >
          {#each listItems as item (item.id)}
            <li
              data-item-id={item.id}
              class="cursor-move"
            >
              <TodoItem
                {item}
                on:toggle={onToggle}
                on:delete={onDelete}
              />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}

</main>

<!-- Settings Button (bottom center) -->
<button
  type="button"
  class="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
  on:click={openSettingsDrawer}
  bind:this={settingsButton}
  aria-haspopup="dialog"
  aria-expanded={showSettingsDrawer}
>
  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
  Settings
</button>

<!-- Settings Drawer -->
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
/>

<!-- Reset Confirmation Dialog -->
{#if showResetConfirm}
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
    on:pointerdown={handleResetOverlayPointerDown}
  >
    <div
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-transform duration-200 ease-out"
      on:pointerdown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      aria-describedby="reset-dialog-description"
      tabindex="-1"
      use:focusTrap={{
        initialFocus: '#reset-dialog-cancel',
        returnFocus: () => resetButton,
        onEscape: closeResetConfirm
      }}
    >
      <div class="mb-4" id="reset-dialog-description">
        <div class="mb-3 flex items-center gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div>
            <h3 id="reset-dialog-title" class="text-lg font-semibold text-slate-900">Reset All Data</h3>
            <p class="mt-1 text-sm text-slate-600">This action cannot be undone.</p>
          </div>
        </div>
        <p class="text-sm text-slate-600">
          This will permanently delete all your tasks, lists, and settings. The app will be reset to its default state.
        </p>
      </div>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          id="reset-dialog-cancel"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          on:click={closeResetConfirm}
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          on:click={handleReset}
        >
          Reset All Data
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Item Confirmation Dialog -->
{#if showDeleteConfirm}
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
    on:pointerdown={handleDeleteOverlayPointerDown}
  >
    <div
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-transform duration-200 ease-out"
      on:pointerdown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      tabindex="-1"
      use:focusTrap={{
        initialFocus: '#delete-dialog-cancel',
        returnFocus: () => deleteButton,
        onEscape: closeDeleteConfirm
      }}
    >
      <div class="mb-4" id="delete-dialog-description">
        <h3 id="delete-dialog-title" class="text-lg font-semibold text-slate-900 mb-2">Delete Item</h3>
        <p class="text-sm text-slate-600">
          Are you sure you wish to delete this item?
        </p>
      </div>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          id="delete-dialog-cancel"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          on:click={closeDeleteConfirm}
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          on:click={confirmDelete}
        >
          Yes - delete it
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notifications -->
<div aria-live="polite" role="status" class="pointer-events-none fixed bottom-6 left-1/2 w-[90vw] max-w-md -translate-x-1/2 transform">
  {#if toast}
    <div class="rounded-lg bg-slate-900/90 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
      {toast}
    </div>
  {/if}
</div>
