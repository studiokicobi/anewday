<script lang="ts">
  import { focusTrap } from '../lib/focusTrap';

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

  let activeView: 'menu' | 'about' | 'appearance' | 'list-organization' | 'your-data' | 'your-privacy' = 'menu';
  let openFaq: string | null = null;
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


  function toggleFaq(faqId: string) {
    openFaq = openFaq === faqId ? null : faqId;
  }

  function handleImportChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement | null;
    if (input) {
      void onImport(input.files);
      input.value = '';
    }
  }

  function handleOverlayClick(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if showSettings}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    on:pointerdown={handleOverlayClick}
  >
    <div
      bind:this={dialogElement}
      class="w-full max-w-md rounded-2xl bg-slate-800 shadow-xl overflow-hidden"
      on:pointerdown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      use:focusTrap={{
        returnFocus: () => returnFocusElement,
        onEscape: onClose
      }}
    >
      <div class="h-full flex flex-col">
        {#if activeView === 'menu'}
        <!-- Menu View -->
        <div class="flex items-center justify-center border-b border-slate-700 p-4 relative">
          <h2 id="settings-title" class="text-lg font-semibold text-white">Settings</h2>
          <button
            type="button"
            class="settings-done-menu absolute right-4 text-brand-400 hover:text-brand-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
            on:click={onClose}
          >
            Done
          </button>
        </div>

        <nav class="overflow-y-auto flex-1" aria-label="Settings sections">
            <button
              type="button"
              id="settings-first-item"
              class="settings-menu-item flex w-full items-center justify-between px-4 py-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              on:click={() => navigateToView('about')}
            >
              <span class="text-base text-white">About</span>
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-4 py-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              on:click={() => navigateToView('appearance')}
            >
              <span class="text-base text-white">Appearance</span>
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-4 py-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              on:click={() => navigateToView('list-organization')}
            >
              <span class="text-base text-white">List Organization</span>
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-4 py-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              on:click={() => navigateToView('your-data')}
            >
              <span class="text-base text-white">Your Data</span>
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-4 py-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              on:click={() => navigateToView('your-privacy')}
            >
              <span class="text-base text-white">Your Privacy</span>
              <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
        </nav>

        {:else}
        <!-- Detail Views -->
        <div class="flex items-center justify-between border-b border-slate-700 p-4">
          <button
            type="button"
            class="breadcrumb-back flex items-center gap-1 text-brand-400 hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
            on:click={() => navigateToView('menu')}
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span class="text-sm font-medium">Settings</span>
          </button>
          <h2 class="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2">
            {#if activeView === 'about'}About
            {:else if activeView === 'appearance'}Appearance
            {:else if activeView === 'list-organization'}List Organization
            {:else if activeView === 'your-data'}Your Data
            {:else if activeView === 'your-privacy'}Your Privacy
            {/if}
          </h2>
          <button
            type="button"
            class="settings-done-detail text-brand-400 hover:text-brand-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
            on:click={onClose}
          >
            Done
          </button>
        </div>

        <div class="settings-detail-content overflow-y-auto flex-1 p-4">
            {#if activeView === 'about'}
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">What is A New Day?</h3>
                  <p class="text-base text-slate-300">A privacy-first daily checklist designed for rebuilding routines. Tasks reset automatically at local midnight to help you focus on daily progress rather than endless accumulation.</p>
                </div>

                <div>
                  <h4 class="text-base font-semibold text-white mb-2">Disclaimer</h4>
                  <p class="text-sm text-slate-300"><strong>Important:</strong> A New Day is a self-guided routine aid and not a substitute for professional or emergency care. If you are in crisis, please seek local support services.</p>
                </div>

                <!-- FAQ Section -->
                <div>
                  <h4 class="text-base font-semibold text-white mb-3">Frequently Asked Questions</h4>
                  <div class="divide-y divide-slate-700">
                    <div class="pb-4">
                      <button
                        type="button"
                        class="flex w-full items-start justify-between text-left group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-2 -m-2"
                        aria-expanded={openFaq === 'faq-1'}
                        on:click={() => toggleFaq('faq-1')}
                      >
                        <span class="text-sm font-medium text-white group-hover:text-slate-200">How does the daily reset work?</span>
                        <svg class="ml-6 h-5 w-5 text-slate-400 transition-transform duration-300" class:rotate-180={openFaq === 'faq-1'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      {#if openFaq === 'faq-1'}
                        <div class="mt-2 pr-12">
                          <p class="text-sm text-slate-300">Tasks automatically reset at local midnight. All completed checkboxes are unchecked, giving you a fresh start each day.</p>
                        </div>
                      {/if}
                    </div>

                    <div class="py-4">
                      <button
                        type="button"
                        class="flex w-full items-start justify-between text-left group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-2 -m-2"
                        aria-expanded={openFaq === 'faq-2'}
                        on:click={() => toggleFaq('faq-2')}
                      >
                        <span class="text-sm font-medium text-white group-hover:text-slate-200">What happens to my data when I close the browser?</span>
                        <svg class="ml-6 h-5 w-5 text-slate-400 transition-transform duration-300" class:rotate-180={openFaq === 'faq-2'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      {#if openFaq === 'faq-2'}
                        <div class="mt-2 pr-12">
                          <p class="text-sm text-slate-300">Your data is stored locally in your browser using IndexedDB. It persists between browser sessions and remains private on your device.</p>
                        </div>
                      {/if}
                    </div>

                    <div class="py-4">
                      <button
                        type="button"
                        class="flex w-full items-start justify-between text-left group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-2 -m-2"
                        aria-expanded={openFaq === 'faq-3'}
                        on:click={() => toggleFaq('faq-3')}
                      >
                        <span class="text-sm font-medium text-white group-hover:text-slate-200">Can I use this on multiple devices?</span>
                        <svg class="ml-6 h-5 w-5 text-slate-400 transition-transform duration-300" class:rotate-180={openFaq === 'faq-3'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      {#if openFaq === 'faq-3'}
                        <div class="mt-2 pr-12">
                          <p class="text-sm text-slate-300">Data doesn't sync between devices since everything stays local. However, you can export your data from one device and import it on another.</p>
                        </div>
                      {/if}
                    </div>

                    <div class="py-4">
                      <button
                        type="button"
                        class="flex w-full items-start justify-between text-left group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-2 -m-2"
                        aria-expanded={openFaq === 'faq-4'}
                        on:click={() => toggleFaq('faq-4')}
                      >
                        <span class="text-sm font-medium text-white group-hover:text-slate-200">What's the difference between single and multi-list mode?</span>
                        <svg class="ml-6 h-5 w-5 text-slate-400 transition-transform duration-300" class:rotate-180={openFaq === 'faq-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      {#if openFaq === 'faq-4'}
                        <div class="mt-2 pr-12">
                          <p class="text-sm text-slate-300">Single mode uses one "Today" list for all tasks. Multi-list mode splits tasks into "Morning," "Anytime," and "Evening" categories.</p>
                        </div>
                      {/if}
                    </div>

                    <div class="pt-4">
                      <button
                        type="button"
                        class="flex w-full items-start justify-between text-left group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-2 -m-2"
                        aria-expanded={openFaq === 'faq-5'}
                        on:click={() => toggleFaq('faq-5')}
                      >
                        <span class="text-sm font-medium text-white group-hover:text-slate-200">Is my data secure?</span>
                        <svg class="ml-6 h-5 w-5 text-slate-400 transition-transform duration-300" class:rotate-180={openFaq === 'faq-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      {#if openFaq === 'faq-5'}
                        <div class="mt-2 pr-12">
                          <p class="text-sm text-slate-300">Yes, your data never leaves your device. There's no tracking, no analytics, and no external servers. When exporting, you can optionally encrypt the file with AES-GCM encryption.</p>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

            {:else if activeView === 'appearance'}
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Theme</h3>
                  <p class="text-sm text-slate-300 mb-4">Choose your preferred theme appearance.</p>
                  <div class="isolate inline-flex rounded-md shadow-sm" role="group" aria-label="Theme selection">
                    <button
                      type="button"
                      class="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 hover:bg-slate-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      class:bg-brand-600={themeMode === 'light'}
                      class:text-white={themeMode === 'light'}
                      class:bg-slate-700={themeMode !== 'light'}
                      class:text-slate-200={themeMode !== 'light'}
                      on:click={() => setThemeMode('light')}
                    >
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                      Light
                    </button>
                    <button
                      type="button"
                      class="relative -ml-px inline-flex items-center px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 hover:bg-slate-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      class:bg-brand-600={themeMode === 'dark'}
                      class:text-white={themeMode === 'dark'}
                      class:bg-slate-700={themeMode !== 'dark'}
                      class:text-slate-200={themeMode !== 'dark'}
                      on:click={() => setThemeMode('dark')}
                    >
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                      </svg>
                      Dark
                    </button>
                    <button
                      type="button"
                      class="relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 hover:bg-slate-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      class:bg-brand-600={themeMode === 'system'}
                      class:text-white={themeMode === 'system'}
                      class:bg-slate-700={themeMode !== 'system'}
                      class:text-slate-200={themeMode !== 'system'}
                      on:click={() => setThemeMode('system')}
                    >
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      System
                    </button>
                  </div>
                  <p class="text-xs text-slate-400 mt-3">System follows your device's appearance settings</p>
                </div>
              </div>

            {:else if activeView === 'list-organization'}
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">List Mode</h3>
                  <p class="text-sm text-slate-300 mb-4">Choose how you want to organize your daily tasks.</p>
                  <div class="flex items-start gap-3">
                    <button
                      type="button"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-800 mt-0.5"
                      class:bg-brand-600={settingsMode === 'multi'}
                      class:bg-slate-600={settingsMode !== 'multi'}
                      role="switch"
                      aria-checked={settingsMode === 'multi'}
                      on:click={toggleMode}
                    >
                      <span
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        class:translate-x-5={settingsMode === 'multi'}
                        class:translate-x-0={settingsMode !== 'multi'}
                      ></span>
                    </button>
                    <div class="flex flex-col gap-1">
                      <button
                        type="button"
                        class="text-left text-sm font-medium text-white"
                        on:click={toggleMode}
                      >
                        Enable Morning / Anytime / Evening lists
                      </button>
                      <span class="text-xs text-slate-400">Split your tasks into three focused time periods throughout the day</span>
                    </div>
                  </div>
                </div>
              </div>

            {:else if activeView === 'your-data'}
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Data Management</h3>
                  <p class="text-sm text-slate-300 mb-4">Manage your personal data with export, import, and reset options.</p>

                  <div class="space-y-4">
                    <!-- Export Section -->
                    <div class="flex flex-col gap-3">
                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-3">
                          <button
                            type="button"
                            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            class:bg-brand-600={encryption}
                            class:bg-slate-600={!encryption}
                            role="switch"
                            aria-checked={encryption}
                            on:click={() => encryption = !encryption}
                          >
                            <span
                              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                              class:translate-x-5={encryption}
                              class:translate-x-0={!encryption}
                            ></span>
                          </button>
                          <button
                            type="button"
                            class="text-left text-sm font-medium text-white"
                            on:click={() => (encryption = !encryption)}
                          >
                            Encrypt export with passphrase
                          </button>
                        </div>
                        {#if encryption}
                          <input
                            type="password"
                            class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Passphrase"
                            bind:value={passphrase}
                            aria-label="Export/import passphrase"
                          />
                        {/if}
                        <p class="text-xs text-slate-400">Optional encryption uses AES-GCM with your passphrase for extra security.</p>
                      </div>
                      <div class="flex flex-col gap-2">
                        <button type="button" class="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-400 hover:bg-brand-900/20 self-start focus:outline-none focus:ring-2 focus:ring-brand-500" on:click={onExport}>
                          Export data
                        </button>
                        <p class="text-xs text-slate-400">Download your tasks and settings as a JSON file for backup or transfer</p>
                      </div>
                    </div>

                    <!-- Import Section -->
                    <div class="flex flex-col gap-2">
                      <label class="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer self-start focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-500">
                        Import data
                        <input type="file" class="sr-only" accept="application/json" on:change={handleImportChange} />
                      </label>
                      <p class="text-xs text-slate-400">Restore your tasks and settings from a previously exported JSON file</p>
                    </div>

                    <!-- Reset Section -->
                    <div class="flex flex-col gap-2">
                      <button
                        type="button"
                        class="self-start rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                        on:click={onOpenResetConfirm}
                      >
                        Reset all data
                      </button>
                      <p class="text-xs text-slate-400">Permanently delete all tasks, lists, and settings to start fresh</p>
                    </div>
                  </div>

                  {#if importError}
                    <p class="mt-3 text-sm text-red-400" role="alert">{importError}</p>
                  {/if}
                </div>
              </div>

            {:else if activeView === 'your-privacy'}
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">Privacy & Data</h3>
                  <div class="text-sm text-slate-300 space-y-2">
                    <p>Your privacy is our priority. A New Day is designed with privacy-first principles:</p>
                    <ul class="list-disc list-inside space-y-1 ml-2">
                      <li><strong>No tracking:</strong> We don't collect analytics, usage data, or personal information</li>
                      <li><strong>Local storage only:</strong> All data stays on your device using IndexedDB</li>
                      <li><strong>No external servers:</strong> Your tasks never leave your device</li>
                      <li><strong>No accounts required:</strong> Use the app without creating profiles or logging in</li>
                      <li><strong>Optional encryption:</strong> Exports can be encrypted with AES-GCM using your passphrase</li>
                      <li><strong>Open source:</strong> The code is transparent and auditable</li>
                    </ul>
                    <p class="pt-2">You have complete control over your data with export, import, and reset options.</p>
                  </div>
                </div>
              </div>
            {/if}
        </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
