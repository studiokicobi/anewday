<script lang="ts">
  import { focusTrap } from '../lib/focusTrap';

  export let showAbout = false;
  export let onClose: () => void;
  export let returnFocusElement: HTMLElement | null = null;

  let dialogElement: HTMLElement;

  // Focus first focusable element when drawer opens, restore focus when closing
  $: if (showAbout) {
    setTimeout(() => {
      const closeButton = dialogElement?.querySelector('.about-close-button') as HTMLElement;
      closeButton?.focus();
    }, 100);
  } else if (!showAbout && returnFocusElement) {
    setTimeout(() => {
      returnFocusElement?.focus();
    }, 50);
  }

  function handleOverlayPointerDown(event: PointerEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if showAbout}
  <div
    class="settings-overlay fixed inset-0 z-50 flex items-end justify-center bg-brand-700/80 dark:bg-black/80"
    on:pointerdown={handleOverlayPointerDown}
  >
    <div
      bind:this={dialogElement}
      class="settings-panel w-full max-w-lg rounded-t-2xl bg-brand-100 dark:bg-brand-800 shadow-xl overflow-hidden h-[75vh] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      use:focusTrap={{
        returnFocus: () => returnFocusElement,
        onEscape: onClose
      }}
    >
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-brand-200 dark:border-brand-700 px-6 py-4">
          <h2 id="about-title" class="text-2xl font-semibold text-brand-900 dark:text-brand-100">About</h2>
          <button
            type="button"
            class="about-close-button text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-1"
            on:click={onClose}
            aria-label="Close"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto flex-1 px-6 py-4 pb-16 space-y-8">
          <!-- About Section -->
          <div class="space-y-6">
            <div>
              <h3 class="settings-heading">What is A New Day?</h3>
              <div class="settings-text-container">
                <p>
                  <strong>A New Day</strong> is a daily checklist designed to support people
                  rebuilding routines. It is a simple app with one defining feature: at
                  midnight, the list resets automatically and unchecks all your items. And in the
                  morning, you have to start the list again.
                </p>
                <p>
                  It is designed for those recovering from mental health challenges, when tasks
                  others may take for granted (eating, sleeping, brushing your teeth, speaking
                  to strangers) have become seemingly insurmountable obstacles. It can also be
                  useful for anyone working to build or maintain habits.
                </p>
              </div>
            </div>

            <div class="settings-text-container space-y-4 bg-brand-200 dark:bg-brand-700 p-4 rounded-lg">
                <h4 class="font-bold">Reminder:</h4>
                <p>
                  This application is a self-guided aid and does not
                  replace professional or emergency support. If you are in a crisis, please seek
                  local support services. And remember you are loved.
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
                <div>
                  <h4 class="settings-subheading">How does the daily reset work?</h4>
                  <p class="settings-text">Tasks automatically reset at local midnight. All completed checkboxes are unchecked, giving you a fresh list to start each morning. If the app is open when midnight arrives, tasks will uncheck automatically and you'll see a notification. No manual refresh is needed.</p>
                </div>

                <div>
                  <h4 class="settings-subheading">What happens to my data when I close the browser?</h4>
                  <p class="settings-text">Your data is stored locally in your browser using IndexedDB. It persists between browser sessions and remains private on your device.</p>
                </div>

                <div>
                  <h4 class="settings-subheading">Can I use this on multiple devices?</h4>
                  <p class="settings-text">Data doesn't sync between devices since everything stays local. However, you can export your data from one device and import it on another or deliver it to your healthcare provider.</p>
                </div>

                <div>
                  <h4 class="settings-subheading">What's the difference between single and multi-list mode?</h4>
                  <p class="settings-text">Single mode uses one "Today" list for all tasks. Multi-list mode splits tasks into "Morning," "Anytime," and "Evening" categories. </p>
                </div>

                <div>
                  <h4 class="settings-subheading">Is my data secure?</h4>
                  <p class="settings-text">Yes. Your data never leaves your device, and there's no tracking, no analytics, and no external servers. When exporting, you can optionally encrypt the file.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
