<script lang="ts">
  export let encryption: boolean;
  export let passphrase: string;
  export let importError: string;
  export let onExport: () => Promise<void>;
  export let onImport: (_files: FileList | null) => Promise<void>;
  export let onOpenResetConfirm: () => void;
  export let resetButton: HTMLButtonElement | null = null;

  function handleImportChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement | null;
    if (input) {
      void onImport(input.files);
      input.value = '';
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h3 class="settings-heading">Managing your data</h3>
    <p class="settings-description">Manage your personal data with export, import, and reset options.</p>

    <div class="space-y-6">
      <!-- Encryption Toggle -->
      <div class="flex items-center gap-3 my-2">
        <button
          type="button"
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-100 dark:focus-visible:ring-offset-brand-800"
          class:bg-brand-900={encryption}
          class:dark:bg-brand-300={encryption}
          class:bg-brand-200={!encryption}
          class:dark:bg-brand-600={!encryption}
          role="switch"
          aria-checked={encryption}
          aria-labelledby="encryption-label"
          on:click={() => encryption = !encryption}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
            class:translate-x-5={encryption}
            class:translate-x-0={!encryption}
          ></span>
        </button>
        <div class="flex flex-col gap-1">
          <button
            type="button"
            id="encryption-label"
            class="text-left text-sm text-brand-900 dark:text-brand-100"
            on:click={() => (encryption = !encryption)}
          >
            Encrypt export with passphrase
          </button>
          <span class="text-xs text-brand-600 dark:text-brand-300">Optional – uses AES-GCM for encryption</span>
        </div>
      </div>

      {#if encryption}
        <input
          type="password"
          class="w-full rounded-lg border border-brand-300 dark:border-brand-600 bg-white dark:bg-brand-700 px-3 py-2 text-base text-brand-900 dark:text-brand-100 placeholder:text-brand-500 dark:placeholder:text-brand-300 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500"
          placeholder="Passphrase"
          bind:value={passphrase}
          aria-label="Export/import passphrase"
        />
      {/if}

      <!-- Export Button -->
      <div>
        <button type="button" class="rounded-full bg-brand-200 dark:bg-brand-700 px-5 py-2 text-sm font-base text-brand-900 dark:text-brand-100 hover:bg-brand-300 dark:hover:bg-brand-600 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500" on:click={onExport}>
          Export data
        </button>
        <p class="text-xs text-brand-600 dark:text-brand-300 mt-2">Download tasks and settings as a JSON file</p>
      </div>

      <!-- Import Button -->
      <div>
        <label class="rounded-full px-5 py-2 bg-brand-200 dark:bg-brand-700 text-sm font-base text-brand-900 dark:text-brand-100 hover:bg-brand-300 dark:hover:bg-brand-600 cursor-pointer inline-flex focus-within:outline-hidden focus-within:ring-1 focus-within:ring-brand-500">
          Import data
          <input type="file" class="sr-only" accept="application/json" on:change={handleImportChange} />
        </label>
        <p class="text-xs text-brand-600 dark:text-brand-300 mt-2">Restore from a JSON file</p>
      </div>

      <!-- Reset Button -->
      <div>
        <button
          type="button"
          class="rounded-full border bg-red-700 dark:bg-red-800 border-red-700 dark:border-red-800 px-5 py-2 text-sm font-base text-red-100 dark:text-red-100 hover:bg-red-600 dark:hover:bg-red-700 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-red-500"
          on:click={onOpenResetConfirm}
          bind:this={resetButton}
        >
          Reset all data
        </button>
        <p class="text-xs text-brand-600 dark:text-brand-300 mt-2">Permanently delete all data</p>
      </div>
    </div>

    {#if importError}
      <p class="mt-3 text-sm text-red-700 dark:text-red-200" role="alert">{importError}</p>
    {/if}
  </div>

  <div class="pt-6 border-t border-brand-300 dark:border-brand-700">
    <h3 class="settings-heading">Your privacy</h3>
    <div class="settings-text space-y-2">
      <p>A New Day is designed with privacy-first principles.</p>
      <ul class="list-disc list-inside space-y-1 pl-4">
        <li>No account is required to use the app.</li>
        <li>No tracking. The app collects no analytics, usage data, or personal information.</li>
        <li>The app uses local storage, not external servers, and your data stays on your device.</li>
        <li>If you do choose to export your data, you can optionally encrypt the export.</li>
        <li>The code is open source and auditable on <a class="underline" href="https://github.com/studiokicobi/anewday">the Github repository.</a></li>
      </ul>
    </div>
  </div>
</div>
