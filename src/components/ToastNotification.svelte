<script lang="ts">
  import { fly } from 'svelte/transition';

  export let message: string;
  export let onDismiss: (() => void) | null = null;
</script>

{#if message}
  <div aria-live="polite" role="status" class="pointer-events-none fixed bottom-6 left-1/2 w-[90vw] max-w-md -translate-x-1/2 transform">
    <div
      class="toast-card pointer-events-auto flex items-center justify-between gap-3 rounded-lg bg-brand-900/90 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-xs"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <span>{message}</span>
      {#if onDismiss}
        <button
          type="button"
          class="shrink-0 rounded-sm p-1 text-white/70 hover:text-white hover:bg-white/20 transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white/50"
          on:click={onDismiss}
          aria-label="Dismiss"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}
