<script lang="ts">
  export let title: string;
  export let onBack: () => void;
  export let onClose: () => void;
</script>

<div class="flex flex-col border-b border-brand-200 dark:border-brand-700 px-6 py-4 gap-2">
  <div class="flex items-center justify-between">
    <button
      type="button"
      class="breadcrumb-back flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
      on:click={onBack}
    >
      <span class="text-sm font-medium">← Info & settings</span>
    </button>
    <button
      type="button"
      class="settings-done-detail text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
      on:click={onClose}
    >
      Done
    </button>
  </div>
  <h2 id="settings-title" class="text-lg font-semibold text-brand-900 dark:text-brand-100 text-center">
    {title}
  </h2>
</div>

<div class="settings-detail-content overflow-y-auto flex-1 px-6 py-4 pb-16">
  <slot />
</div>
