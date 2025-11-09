<script lang="ts">
  export let settingsMode: 'single' | 'multi';
  export let toggleMode: () => Promise<void>;
</script>

<div class="space-y-6">
  <div>
    <h3 class="settings-heading">List mode</h3>
    <p class="settings-description">
      Those in the early days of recovery should use the default single list. With time, it can be helpful to split 
      your tasks into three focused time periods: Morning, Anytime, and Evening. 
    </p>
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-brand-100 dark:focus:ring-offset-brand-800"
        class:bg-brand-900={settingsMode === 'multi'}
        class:dark:bg-brand-300={settingsMode === 'multi'}
        class:bg-brand-300={settingsMode !== 'multi'}
        class:dark:bg-brand-600={settingsMode !== 'multi'}
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
          class="text-left text-sm font-medium text-brand-900 dark:text-brand-100"
          on:click={toggleMode}
        >
          Enable Morning / Anytime / Evening lists
        </button>
      </div>
    </div>
  </div>
</div>
