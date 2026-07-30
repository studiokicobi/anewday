<script lang="ts">
  import { focusTrap } from '../lib/focusTrap';

  export let onConfirm: () => void;
  export let onCancel: () => void;
  export let returnFocusElement: HTMLElement | null = null;

  function handleOverlayPointerDown(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }
</script>

<!-- Presentational backdrop. Dismissing by clicking outside is a redundant
     convenience: Escape (via focusTrap) and the Cancel button both close it. -->
<div
  class="fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4"
  role="presentation"
  on:pointerdown={handleOverlayPointerDown}
>
  <div
    class="w-full max-w-md rounded-lg bg-white dark:bg-brand-800 p-6 shadow-xl transition-transform duration-200 ease-out"
    on:pointerdown|stopPropagation
    role="dialog"
    aria-modal="true"
    aria-labelledby="reset-dialog-title"
    aria-describedby="reset-dialog-description"
    tabindex="-1"
    use:focusTrap={{
      initialFocus: '#reset-dialog-cancel',
      returnFocus: returnFocusElement,
      onEscape: onCancel
    }}
  >
    <div class="mb-4" id="reset-dialog-description">
      <div class="mb-3 flex items-center gap-3">
        <div class="shrink-0">
          <svg class="h-6 w-6 text-brand-600 dark:text-brand-300" version="1.1" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="m600 816c33.141 0 60 26.859 60 60s-26.859 60-60 60-60-26.859-60-60 26.859-60 60-60z"/>
            <path fill="currentColor" d="m600 372c26.531 0 48 21.469 48 48v288c0 26.531-21.469 48-48 48-26.484 0-48-21.469-48-48v-288c0-26.531 21.516-48 48-48z"/>
            <path fill="currentColor" d="m600 120c44.344 0 86.578 23.391 111.98 65.344l406.13 671.39c28.406 46.922 27.375 101.67 7.2188 144.47-20.25 42.891-62.578 78.797-119.2 78.797h-812.26c-56.578 0-98.953-35.906-119.16-78.797-20.203-42.797-21.234-97.547 7.1719-144.47l406.13-671.39c25.406-41.953 67.641-65.344 111.98-65.344zm0 96c-9.5625 0-21.234 4.7812-29.859 19.031l-406.08 671.34c-10.312 17.016-10.266 37.5-2.5312 53.906 7.7344 16.359 20.156 23.719 32.344 23.719h812.26c12.188 0 24.656-7.3594 32.344-23.719 7.7344-16.406 7.7812-36.891-2.4844-53.906l-406.13-671.34c-8.625-14.25-20.297-19.031-29.859-19.031z" fill-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <h3 id="reset-dialog-title" class="text-lg mt-1 text-brand-900 dark:text-brand-100">Reset all data</h3>
        </div>
      </div>
      <p class="text-sm text-brand-800 dark:text-brand-300">
        This will permanently delete all your tasks, lists, and settings. The app will be reset to its default state.
      </p>
    </div>
    <div class="flex justify-end gap-3">
      <button
        type="button"
        id="reset-dialog-cancel"
        class="rounded-full bg-brand-100 dark:bg-brand-700 px-4 py-2 text-sm text-brand-900 dark:text-brand-100 hover:bg-brand-200/50 dark:hover:bg-brand-600 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500"
        on:click={onCancel}
      >
        Cancel
      </button>
      <button
        type="button"
        class="rounded-full border bg-red-200 dark:bg-red-900 border-red-600 dark:border-red-400 px-4 py-2 text-sm text-red-950 dark:text-red-100 hover:bg-red-50 dark:hover:bg-red-800 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-red-500"
        on:click={onConfirm}
      >
        Reset all data
      </button>
    </div>
  </div>
</div>
