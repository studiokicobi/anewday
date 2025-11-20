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
  let expandedFaq: number | null = null;

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

  function toggleFaq(index: number) {
    expandedFaq = expandedFaq === index ? null : index;
  }
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
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 0 1 0-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></g></svg>
                Appearance
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200 dark:hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('list-organization')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 12H9m12-6H9m12 12H9m-4-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                List organization
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              type="button"
              class="settings-menu-item flex w-full items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-700 hover:bg-brand-200 dark:hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              on:click={() => navigateToView('your-data')}
            >
              <span class="flex items-center gap-3 text-base text-brand-900 dark:text-brand-100">
                <svg class="h-6 w-6 shrink-0 text-brand-400" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 10V8A5 5 0 0 0 7 8v2m5 4.5v2M8.8 21h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C20 18.72 20 17.88 20 16.2v-1.4c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 10 16.88 10 15.2 10H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 12.28 4 13.12 4 14.8v1.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 21 7.12 21 8.8 21z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Your data & privacy
              </span>
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

          <!-- About Section -->
          <div class="px-6 pt-3 pb-16 space-y-8">
          <!-- About Section -->
          <div class="space-y-6">
            <div>
              <h2 class="settings-heading">What is A New Day?</h2>
              <div class="settings-text-container">
                <p>
                  <strong>A New Day</strong> is a simple daily to-do app with one small, unique 
                  feature: at midnight, your list resets automatically and unchecks all your items. 
                  And the next day, the only thing to do is start your list again.
                </p>
                <p>
                  It is designed to support those recovering from mental health challenges, when 
                  tasks many may take for granted (rising from bed, brushing one’s teeth, eating 
                  regular meals) have become seemingly insurmountable obstacles. 
                </p>
                <p>
                  The app does not track progress or ask to share results on social media. It does not 
                  judge you. Its one function is to focus on this moment, today. <strong>A New Day</strong> is a quiet 
                  tool for people rebuilding routines. 
                </p>
              </div>
            </div>

            <div class="settings-text-container space-y-4 bg-brand-200 dark:bg-brand-700 p-4 rounded-lg">
                <h4 class="font-medium">A reminder</h4>
                <p>
                  This application is a self-guided aid and does not replace professional or emergency 
                  support. If you are in a crisis, please seek local support services. You are important.
                </p>
            </div>
          </div>

          <!-- Usage Section -->
          <div class="space-y-6">
            <div>
              <h3 class="settings-heading mb-4">Using A New Day</h3>

              <div class="space-y-4 mb-6">
                <p class="settings-text">
                  A New Day is a progressive web app, a website that works like a native app.
                  You can use A New Day in the browser. If you choose to install it, the app
                  will launch from your home screen, run in fullscreen, and update automatically.
                  </p>
                </div>


              <div class="space-y-4">
              <h3 class="settings-heading">FAQ</h3>
                <div>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    on:click={() => toggleFaq(0)}
                    aria-expanded={expandedFaq === 0}
                    aria-controls="faq-0"
                  >
                    How does the daily reset work?
                    <svg
                      class="h-5 w-5 text-brand-600 dark:text-brand-400 transition-transform duration-200"
                      class:rotate-180={expandedFaq === 0}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if expandedFaq === 0}
                    <p id="faq-0" class="settings-text mt-2">Tasks automatically reset at local midnight. All completed checkboxes are unchecked, giving you a fresh list to start each morning. If the app is open when midnight arrives, tasks will uncheck automatically and you'll see a notification. No manual refresh is needed.</p>
                  {/if}
                </div>

                <div>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    on:click={() => toggleFaq(1)}
                    aria-expanded={expandedFaq === 1}
                    aria-controls="faq-1"
                  >
                    What happens to my data when I close the browser?
                    <svg
                      class="h-5 w-5 text-brand-600 dark:text-brand-400 transition-transform duration-200"
                      class:rotate-180={expandedFaq === 1}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if expandedFaq === 1}
                    <p id="faq-1" class="settings-text mt-2">Your data is stored locally in your browser using IndexedDB. It persists between browser sessions and remains private on your device.</p>
                  {/if}
                </div>

                <div>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    on:click={() => toggleFaq(2)}
                    aria-expanded={expandedFaq === 2}
                    aria-controls="faq-2"
                  >
                    Can I use this on multiple devices?
                    <svg
                      class="h-5 w-5 text-brand-600 dark:text-brand-400 transition-transform duration-200"
                      class:rotate-180={expandedFaq === 2}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if expandedFaq === 2}
                    <p id="faq-2" class="settings-text mt-2">Data doesn't sync between devices since everything stays local. However, you can export your data from one device and import it on another or deliver it to your healthcare provider.</p>
                  {/if}
                </div>

                <div>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    on:click={() => toggleFaq(3)}
                    aria-expanded={expandedFaq === 3}
                    aria-controls="faq-3"
                  >
                    What's the difference between single and multi-list mode?
                    <svg
                      class="h-5 w-5 text-brand-600 dark:text-brand-400 transition-transform duration-200"
                      class:rotate-180={expandedFaq === 3}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if expandedFaq === 3}
                    <p id="faq-3" class="settings-text mt-2">Single mode uses one "Today" list for all tasks. Multi-list mode splits tasks into "Morning," "Anytime," and "Evening" categories. </p>
                  {/if}
                </div>

                <div>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    on:click={() => toggleFaq(4)}
                    aria-expanded={expandedFaq === 4}
                    aria-controls="faq-4"
                  >
                    Is my data secure?
                    <svg
                      class="h-5 w-5 text-brand-600 dark:text-brand-400 transition-transform duration-200"
                      class:rotate-180={expandedFaq === 4}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {#if expandedFaq === 4}
                    <p id="faq-4" class="settings-text mt-2">Yes. Your data never leaves your device, and there's no tracking, no analytics, and no external servers. When exporting, you can optionally encrypt the file.</p>
                  {/if}
                </div>
              </div>
              
              <div class="settings-text pt-6 mt-6 border-t text-sm border-brand-200 dark:border-brand-700">
                <p>
                  Made with ♥️ by <strong>Studio Kicobi</strong>.
                </p>
              </div>

            </div>
          </div>
          </div>
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
