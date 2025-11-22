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
    restoreItem,
    exportState as exportSnapshot,
    importState as importSnapshot,
    checkForReset,
    updateSettings,
    resetAllData,
    type TodoItem
  } from './stores/state';

  let description = '';
  let toast = '';
  let selectedList = '';
  let encryption = false;
  let passphrase = '';
  let importError = '';
  let showResetConfirm = false;
  let themeMode: 'light' | 'dark' | 'system' = 'system';
  let showSettingsDrawer = false;
  let settingsButton: HTMLButtonElement | null = null;
  let resetButton: HTMLButtonElement | null = null;
  let taskInput: HTMLInputElement | null = null;
  let previousBodyOverflow: string | null = null;
  let bodyScrollLockCount = 0;

  // Undo toast state
  let deletedItem: TodoItem | null = null;
  let deleteTimer: ReturnType<typeof setTimeout> | null = null;

  const clearToast = () => {
    toast = '';
    deletedItem = null;
  };
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  const handleVisibility = async () => {
    const didReset = await checkForReset();
    if (didReset) {
      announce('It’s a new day. The list has been reset.');
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
      (window as any).__anewdayRequestReset = handleVisibility;
      (window as any).__anewdaySetMode = async (mode: 'single' | 'multi') => {
        await initialization;
        await updateSettings({ mode });
      };
    }

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribeReset();
      if (automationHelpersEnabled && typeof window !== 'undefined') {
        (window as any).__anewdayRequestReset = undefined;
        (window as any).__anewdaySetMode = undefined;
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
    } catch (error) {
      importError = (error as Error).message;
    }
  }

  async function handleToggle(id: string) {
    await toggleItem(id);
  }

  async function handleDelete(id: string) {
    // Find the item to delete
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Clear any existing delete timer
    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }

    // Store complete item for undo (preserves ID, position, etc.)
    deletedItem = { ...item };

    // Delete immediately
    await deleteItem(id);

    // Show undo toast
    toast = `"${item.title}" deleted`;

    // Clear existing toast timer
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    // Set timer to clear toast after 5 seconds
    toastTimer = setTimeout(() => {
      clearToast();
      toastTimer = null;
      deletedItem = null;
    }, 5000);

    // Set timer to permanently commit deletion after 5 seconds
    deleteTimer = setTimeout(() => {
      deletedItem = null;
      deleteTimer = null;
    }, 5000);
  }

  async function undoDelete() {
    if (!deletedItem) return;

    // Clear timers
    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    // Restore the item with its original ID and position
    await restoreItem(deletedItem);

    // Clear toast and deleted item
    toast = '';
    deletedItem = null;
  }

  function onToggle(event: CustomEvent<string>) {
    void handleToggle(event.detail);
  }

  function onDelete(event: CustomEvent<string>) {
    void handleDelete(event.detail);
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
  class="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pt-6 pb-8"
  aria-label="Main application"
>

  <div class="flex-grow flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-3xl font-medium tracking-[-0.04em] text-brand-950 dark:text-brand-300">A New Day</h1>
      <p class="text-xs uppercase text-brand-700 dark:text-brand-400 tracking-wide">{getCurrentDate()}</p>
      <p class="hidden text-base text-brand-900 dark:text-brand-100">Daily checklist designed for rebuilding routines. Tasks reset automatically at local midnight.</p>
    </header>

    <AddTaskForm
      bind:description
      {lists}
      bind:selectedList
      bind:taskInput
      onSubmit={handleSubmit}
    />

  {#each lists as list (list.id)}
    {@const listItems = items.filter(item => item.listId === list.id)}
    <TodoList
      {list}
      items={listItems}
      on:toggle={onToggle}
      on:delete={onDelete}
    />
  {/each}

  <div class="mt-auto mx-auto">
    <div class="flex items-center gap-2 text-sm ">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-brand-600 dark:text-brand-200 bg-white dark:bg-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-600 shadow-[0_0_50px_0_#F2EFED] dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        on:click={openSettingsDrawer}
        bind:this={settingsButton}
        aria-haspopup="dialog"
        aria-expanded={showSettingsDrawer}
        data-settings-trigger
      >
        <svg class="text-brand-300 dark:text-brand-500" width="16" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM2.17 2a3.001 3.001 0 0 1 5.66 0H15a1 1 0 1 1 0 2H7.83a3.001 3.001 0 0 1-5.66 0H1a1 1 0 0 1 0-2h1.17zM11 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM8.17 8a3.001 3.001 0 0 1 5.66 0H15a1 1 0 1 1 0 2h-1.17a3.001 3.001 0 0 1-5.66 0H1a1 1 0 1 1 0-2h7.17zM5 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2.83 0a3.001 3.001 0 0 1 5.66 0H15a1 1 0 1 1 0 2H7.83a3.001 3.001 0 0 1-5.66 0H1a1 1 0 1 1 0-2h1.17z" fill="currentColor"/></svg>
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
  onUndo={deletedItem ? undoDelete : null}
/>
