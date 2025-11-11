<script lang="ts">
  export let message: string;
  export let onUndo: (() => void) | null = null;
</script>

{#if message}
  <div aria-live="polite" role="status" class="pointer-events-none fixed bottom-6 left-1/2 w-[90vw] max-w-md -translate-x-1/2 transform">
    <div
      class="toast-card pointer-events-auto flex items-center justify-between gap-3 rounded-lg bg-brand-900/90 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
    >
      <span>{message}</span>
      {#if onUndo}
        <button
          type="button"
          class="rounded bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-white/30 transition-colors duration-150"
          on:click={onUndo}
        >
          Undo
        </button>
      {/if}
    </div>
  </div>
{/if}
