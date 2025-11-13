<script lang="ts">
  import { focusTrap } from '../lib/focusTrap';
  import SettingSection from './settings/SettingSection.svelte';
  import AppearanceContent from './settings/AppearanceContent.svelte';
  import ListOrganizationContent from './settings/ListOrganizationContent.svelte';
  import YourDataContent from './settings/YourDataContent.svelte';

  export let showSettings = false;
  export let onClose: () => void;
  export let returnFocusElement: HTMLElement | null = null;
  export let themeMode: 'light' | 'dark' | 'system' = 'system';
  // eslint-disable-next-line no-unused-vars
  export let setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  export let toggleMode: () => Promise<void>;
  export let settingsMode: 'single' | 'multi';
  export let onExport: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  export let onImport: (files: FileList | null) => Promise<void>;
  export let onOpenResetConfirm: () => void;
  export let encryption = false;
  export let passphrase = '';
  export let importError = '';
  export let resetButton: HTMLButtonElement | null = null;

  let activeView: 'menu' | 'appearance' | 'list-organization' | 'your-data' = 'menu';
  let dialogElement: HTMLElement;

  // Reset to menu view when drawer closes
  $: if (!showSettings) {
    activeView = 'menu';
  }

  // Focus first menu item when drawer opens, restore focus when closing
  $: if (showSettings && activeView === 'menu') {
    setTimeout(() => {
      const firstItem = document.getElementById('settings-first-item');
      firstItem?.focus();
    }, 100);
  } else if (!showSettings && returnFocusElement) {
    setTimeout(() => {
      returnFocusElement?.focus();
    }, 50);
  }

  function navigateToView(view: typeof activeView) {
    activeView = view;
    // Focus the first focusable element in the new view after render
    setTimeout(() => {
      if (view === 'menu') {
        const firstMenuItem = document.getElementById('settings-first-item');
        firstMenuItem?.focus();
      } else {
        const backButton = document.querySelector('.breadcrumb-back') as HTMLElement;
        backButton?.focus();
      }
    }, 50);
  }

  function handleOverlayPointerDown(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const sectionTitles = {
    appearance: 'Appearance',
    'list-organization': 'List organization',
    'your-data': 'Your data & privacy',
  };
</script>

{#if showSettings}
  <div
    class="settings-overlay fixed inset-0 z-50 flex items-end justify-center bg-brand-700/80 dark:bg-black/80"
    on:pointerdown={handleOverlayPointerDown}
  >
    <div
      bind:this={dialogElement}
      class="settings-panel w-full max-w-lg rounded-t-2xl bg-brand-100 dark:bg-brand-800 shadow-xl overflow-hidden h-[75vh] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      use:focusTrap={{
        returnFocus: () => returnFocusElement,
        onEscape: onClose
      }}
    >
      <div class="flex flex-col h-full">
        {#if activeView === 'menu'}
        <!-- Menu View -->
        <div class="flex items-center justify-between border-b border-brand-200 dark:border-brand-700 px-6 py-4">
          <h2 id="settings-title" class="text-2xl font-semibold text-brand-900 dark:text-brand-100">Settings</h2>
          <button
            type="button"
            class="settings-done-menu text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-1"
            on:click={onClose}
            aria-label="Close"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <nav class="overflow-y-auto flex-1 pb-12" aria-label="Settings sections">
            <button
              type="button"
              id="settings-first-item"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200 dark:hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('appearance')}
            >
              <span class="text-base text-brand-900 dark:text-brand-100">Appearance</span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200 dark:hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('list-organization')}
            >
              <span class="text-base text-brand-900 dark:text-brand-100">List organization</span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 hover:bg-brand-200 dark:hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('your-data')}
            >
              <span class="text-base text-brand-900 dark:text-brand-100">Your data & privacy</span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
        </nav>

        {:else}
        <!-- Detail Views -->
        <SettingSection
          title={sectionTitles[activeView]}
          onBack={() => navigateToView('menu')}
          onClose={onClose}
        >
          {#if activeView === 'appearance'}
            <AppearanceContent {themeMode} {setThemeMode} />
          {:else if activeView === 'list-organization'}
            <ListOrganizationContent {settingsMode} {toggleMode} />
          {:else if activeView === 'your-data'}
            <YourDataContent
              bind:encryption
              bind:passphrase
              bind:resetButton
              {importError}
              {onExport}
              {onImport}
              {onOpenResetConfirm}
            />
          {/if}
        </SettingSection>
        {/if}
      </div>
    </div>
  </div>
{/if}
