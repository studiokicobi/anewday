<script lang="ts">
  export let title: string;
  export let onBack: () => void;
  export let onClose: () => void;
</script>

<div class="flex flex-col border-b border-brand-200 dark:border-brand-700 px-6 py-4 gap-2">
  <div class="flex items-center justify-between">
    <h2 id="settings-title" class="text-lg font-semibold text-brand-900 dark:text-brand-100">
      {title}
    </h2>
    <button
      type="button"
      class="settings-done-detail text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-1"
      on:click={onClose}
      aria-label="Close"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </div>
  <div class="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400">
    <button
      type="button"
      class="breadcrumb-back hover:text-brand-800 dark:hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
      on:click={onBack}
    >
      Info & settings
    </button>
    <span>›</span>
    <span class="text-brand-900 dark:text-brand-100">{title}</span>
  </div>
</div>

<div class="settings-detail-content overflow-y-auto flex-1 px-6 py-4 pb-16">
  <slot />
</div>
