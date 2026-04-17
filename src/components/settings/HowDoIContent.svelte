<script lang="ts">
  let expandedFaq: number | null = null;

  function toggleFaq(index: number) {
    expandedFaq = expandedFaq === index ? null : index;
  }
</script>

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
          class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500 rounded-sm"
          on:click={() => toggleFaq(0)}
          aria-expanded={expandedFaq === 0}
          aria-controls="faq-0"
        >
          How does the daily reset work?
          <svg
            class="h-5 w-5 text-brand-600 dark:text-brand-200 transition-transform duration-200"
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
          class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500 rounded-sm"
          on:click={() => toggleFaq(1)}
          aria-expanded={expandedFaq === 1}
          aria-controls="faq-1"
        >
          What happens to my data when I close the browser?
          <svg
            class="h-5 w-5 text-brand-600 dark:text-brand-200 transition-transform duration-200"
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
          class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500 rounded-sm"
          on:click={() => toggleFaq(2)}
          aria-expanded={expandedFaq === 2}
          aria-controls="faq-2"
        >
          Can I use this on multiple devices?
          <svg
            class="h-5 w-5 text-brand-600 dark:text-brand-200 transition-transform duration-200"
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
          class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500 rounded-sm"
          on:click={() => toggleFaq(3)}
          aria-expanded={expandedFaq === 3}
          aria-controls="faq-3"
        >
          What's the difference between single and multi-list mode?
          <svg
            class="h-5 w-5 text-brand-600 dark:text-brand-200 transition-transform duration-200"
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
          class="flex w-full items-center justify-between text-left settings-subheading py-2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-500 rounded-sm"
          on:click={() => toggleFaq(4)}
          aria-expanded={expandedFaq === 4}
          aria-controls="faq-4"
        >
          Is my data secure?
          <svg
            class="h-5 w-5 text-brand-600 dark:text-brand-200 transition-transform duration-200"
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
  </div>
</div>
