<script lang="ts">
  export let themeMode: 'light' | 'dark' | 'system' = 'system';
  export let setThemeMode: (_mode: 'light' | 'dark' | 'system') => void;
</script>

<div class="space-y-6">
  <div>
    <h3 class="settings-heading">Theme</h3>
    <p class="settings-description">
      Choose your preferred theme appearance. System follows your device's appearance settings.
    </p>
    <div class="isolate inline-flex rounded-full shadow-sm" role="group" aria-label="Theme selection">
      <button
        type="button"
        class="relative inline-flex items-center rounded-l-full px-5 py-2 text-sm font-base border border-brand-300 dark:border-brand-600 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        class:bg-brand-600={themeMode === 'light'}
        class:dark:bg-brand-300={themeMode === 'light'}
        class:text-brand-100={themeMode === 'light'}
        class:dark:text-brand-900={themeMode === 'light'}
        class:hover:bg-brand-700={themeMode === 'light'}
        class:dark:hover:bg-brand-400={themeMode === 'light'}
        class:bg-brand-100={themeMode !== 'light'}
        class:dark:bg-brand-700={themeMode !== 'light'}
        class:text-brand-900={themeMode !== 'light'}
        class:dark:text-brand-100={themeMode !== 'light'}
        class:hover:bg-brand-200={themeMode !== 'light'}
        class:dark:hover:bg-brand-600={themeMode !== 'light'}
        on:click={() => setThemeMode('light')}
      >
        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        Light
      </button>
      <button
        type="button"
        class="relative -ml-px inline-flex items-center px-5 py-2 text-sm font-base border border-brand-300 dark:border-brand-600 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        class:bg-brand-600={themeMode === 'dark'}
        class:dark:bg-brand-300={themeMode === 'dark'}
        class:text-brand-100={themeMode === 'dark'}
        class:dark:text-brand-900={themeMode === 'dark'}
        class:hover:bg-brand-700={themeMode === 'dark'}
        class:dark:hover:bg-brand-400={themeMode === 'dark'}
        class:bg-brand-100={themeMode !== 'dark'}
        class:dark:bg-brand-700={themeMode !== 'dark'}
        class:text-brand-900={themeMode !== 'dark'}
        class:dark:text-brand-100={themeMode !== 'dark'}
        class:hover:bg-brand-200={themeMode !== 'dark'}
        class:dark:hover:bg-brand-600={themeMode !== 'dark'}
        on:click={() => setThemeMode('dark')}
      >
        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
        Dark
      </button>
      <button
        type="button"
        class="relative -ml-px inline-flex items-center rounded-r-full px-5 py-2 text-sm font-base border border-brand-300 dark:border-brand-600 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        class:bg-brand-600={themeMode === 'system'}
        class:dark:bg-brand-300={themeMode === 'system'}
        class:text-brand-100={themeMode === 'system'}
        class:dark:text-brand-900={themeMode === 'system'}
        class:hover:bg-brand-700={themeMode === 'system'}
        class:dark:hover:bg-brand-400={themeMode === 'system'}
        class:bg-brand-100={themeMode !== 'system'}
        class:dark:bg-brand-700={themeMode !== 'system'}
        class:text-brand-900={themeMode !== 'system'}
        class:dark:text-brand-100={themeMode !== 'system'}
        class:hover:bg-brand-200={themeMode !== 'system'}
        class:dark:hover:bg-brand-600={themeMode !== 'system'}
        on:click={() => setThemeMode('system')}
      >
        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        System
      </button>
    </div>
  </div>
</div>
