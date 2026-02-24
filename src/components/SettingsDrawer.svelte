<script lang="ts">
  import { focusTrap } from '../lib/focusTrap';
  import SettingSection from './settings/SettingSection.svelte';
  import AboutContent from './settings/AboutContent.svelte';
  import HowDoIContent from './settings/HowDoIContent.svelte';
  import FeedbackContent from './settings/FeedbackContent.svelte';
  import AppearanceContent from './settings/AppearanceContent.svelte';
  import ListOrganizationContent from './settings/ListOrganizationContent.svelte';
  import YourDataContent from './settings/YourDataContent.svelte';

  export let showSettings = false;
  export let onClose: () => void;
  export let returnFocusElement: HTMLElement | null = null;
  export let themeMode: 'light' | 'dark' | 'system' = 'system';
  export let setThemeMode: (_mode: 'light' | 'dark' | 'system') => void;
  export let toggleMode: () => Promise<void>;
  export let settingsMode: 'single' | 'multi';
  export let onExport: () => Promise<void>;
  export let onImport: (_files: FileList | null) => Promise<void>;
  export let onOpenResetConfirm: () => void;
  export let encryption = false;
  export let passphrase = '';
  export let importError = '';
  export let resetButton: HTMLButtonElement | null = null;

  let activeView: 'menu' | 'about' | 'how-do-i' | 'feedback' | 'appearance' | 'list-organization' | 'your-data' = 'menu';
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
    about: 'About',
    'how-do-i': 'How do I?',
    feedback: 'Feedback',
    appearance: 'Appearance',
    'list-organization': 'List organization',
    'your-data': 'Your data & privacy',
  };
</script>

{#if showSettings}
  <div
    class="settings-overlay fixed inset-0 z-50 flex items-end justify-center bg-brand-900/80 dark:bg-black/80"
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
          <h2 id="settings-title" class="text-2xl font-medium text-brand-900 dark:text-brand-100">Settings</h2>
          <button
            type="button"
            class="settings-done-menu text-brand-600 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-1"
            on:click={onClose}
            aria-label="Close"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <nav class="overflow-y-auto flex-1 pb-12" aria-label="Settings sections">
            <!-- About -->
            <button
              type="button"
              id="settings-first-item"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('about')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 11.9999V15.9999M12 8.6249V8.62378M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                About
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <!-- How do I? -->
            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('how-do-i')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.28149 9.71853C9.28149 8.21713 10.4986 7 12 7C13.5014 7 14.7186 8.21713 14.7186 9.71853C14.7186 10.6748 14.2248 11.5157 13.4784 12.0003C12.7544 12.4704 12 13.1368 12 14M12 17H12.001M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                How do I?
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <!-- Feedback -->
            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('feedback')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.8032 7.76159L16.295 11.2668C14.7385 12.2573 13.9602 12.7526 13.1238 12.9455C12.3843 13.1161 11.6157 13.1161 10.8762 12.9455C10.0398 12.7526 9.26153 12.2573 7.70499 11.2668L2.19678 7.76159M21.8032 7.76159C22 8.72189 22 10.006 22 12C22 14.8003 22 16.2004 21.455 17.27C20.9757 18.2108 20.2108 18.9757 19.27 19.455C18.2004 20 16.8003 20 14 20H10C7.19974 20 5.79961 20 4.73005 19.455C3.78924 18.9757 3.02433 18.2108 2.54497 17.27C2 16.2004 2 14.8003 2 12C2 10.006 2 8.72189 2.19678 7.76159M21.8032 7.76159C21.7237 7.37332 21.6119 7.03798 21.455 6.73005C20.9757 5.78924 20.2108 5.02433 19.27 4.54497C18.2004 4 16.8003 4 14 4H10C7.19974 4 5.79961 4 4.73005 4.54497C3.78924 5.02433 3.02433 5.78924 2.54497 6.73005C2.38807 7.03798 2.27634 7.37332 2.19678 7.76159" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Feedback
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <!-- Appearance -->
            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('appearance')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 0 1 0-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></g></svg>
                Appearance
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <!-- List organization -->
            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('list-organization')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 12H9m12-6H9m12 12H9m-4-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                List organization
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <!-- Your data & privacy -->
            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200/50 dark:hover:bg-brand-700/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('your-data')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 10V8A5 5 0 0 0 7 8v2m5 4.5v2M8.8 21h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C20 18.72 20 17.88 20 16.2v-1.4c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 10 16.88 10 15.2 10H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 12.28 4 13.12 4 14.8v1.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 21 7.12 21 8.8 21z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Your data & privacy
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {#if activeView === 'about'}
            <AboutContent />
          {:else if activeView === 'how-do-i'}
            <HowDoIContent />
          {:else if activeView === 'feedback'}
            <FeedbackContent />
          {:else if activeView === 'appearance'}
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
