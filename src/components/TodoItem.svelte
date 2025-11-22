<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { dragHandle } from '../lib/dragHandle';

  export let item: { id: string; title: string; completed: boolean };

  const dispatch = createEventDispatcher<{ toggle: string; delete: string }>();
  const checkboxId = `todo-${item.id}`;

  const announceToggle = () => dispatch('toggle', item.id);
  const announceDelete = () => dispatch('delete', item.id);

  // Swipe-to-delete state
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  let swipeDistance = 0;
  let touchStartedOnInteractive = false;
  const SWIPE_THRESHOLD = 100; // Distance in pixels to trigger delete

  const INTERACTIVE_SELECTOR = 'input,button,label,a,[role="button"],[role="link"],.drag-handle,[data-drag-handle]';

  function isInteractiveTarget(target: EventTarget | null) {
    let node: HTMLElement | null = null;
    if (target instanceof HTMLElement) {
      node = target;
    } else if (target instanceof Node) {
      node = target.parentElement;
    }
    return node ? Boolean(node.closest(INTERACTIVE_SELECTOR)) : false;
  }

  function handleTouchStart(event: TouchEvent) {
    touchStartedOnInteractive = isInteractiveTarget(event.target);
    if (touchStartedOnInteractive) {
      // Completely skip swipe logic for interactive elements
      isSwiping = false;
      swipeDistance = 0;
      return;
    }
    touchStartX = event.touches[0].clientX;
    isSwiping = true;
  }

  function handleTouchMove(event: TouchEvent) {
    if (touchStartedOnInteractive) {
      return;
    }
    if (!isSwiping) return;

    touchCurrentX = event.touches[0].clientX;
    const diff = touchStartX - touchCurrentX;

    // Only allow swipe left (positive diff)
    if (diff > 0) {
      swipeDistance = Math.min(diff, SWIPE_THRESHOLD + 20);
    } else {
      swipeDistance = 0;
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartedOnInteractive) {
      touchStartedOnInteractive = false;
      isSwiping = false;
      swipeDistance = 0;
      return;
    }
    if (!isSwiping) return;

    isSwiping = false;

    // If swiped past threshold, delete the item
    if (swipeDistance >= SWIPE_THRESHOLD) {
      announceDelete();
    }

    // Reset swipe distance
    swipeDistance = 0;
  }

  function handleCheckboxKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Allow Enter to toggle checkbox (in addition to Space which is default)
      // Space is handled automatically by the browser
      event.preventDefault();
      announceToggle();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      // Delete item with keyboard shortcut
      event.preventDefault();
      announceDelete();
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      const deleteBtn = (event.currentTarget as HTMLElement).closest('.todo-item')?.querySelector('button') as HTMLElement;
      if (deleteBtn) {
        deleteBtn.focus();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      // Go back to Add button
      const addBtn = document.querySelector('button[type="submit"]') as HTMLElement;
      addBtn?.focus();
    }
  }

  function handleDeleteKeydown(event: KeyboardEvent) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Delete item with keyboard shortcut
      event.preventDefault();
      announceDelete();
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      // Find next checkbox
      const allCheckboxes = Array.from(document.querySelectorAll('.todo-item input[type="checkbox"]'));
      const currentCheckbox = (event.currentTarget as HTMLElement).closest('.todo-item')?.querySelector('input[type="checkbox"]');
      const currentIndex = allCheckboxes.indexOf(currentCheckbox as Element);

      if (currentIndex >= 0 && currentIndex < allCheckboxes.length - 1) {
        // Focus next checkbox
        (allCheckboxes[currentIndex + 1] as HTMLElement).focus();
      } else {
        // Last item - go to Settings button
        const settingsBtn = document.querySelector('button[data-settings-trigger]') as HTMLElement;
        settingsBtn?.focus();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      const checkbox = (event.currentTarget as HTMLElement).closest('.todo-item')?.querySelector('input[type="checkbox"]') as HTMLElement;
      checkbox?.focus();
    }
  }
</script>

<div class="todo-item relative overflow-hidden">
  <!-- Delete background (revealed on swipe) -->
  <div class="absolute inset-0 flex items-center justify-end bg-red-500 px-4">
    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
  </div>

  <!-- Main item content (slides on swipe) -->
  <div
    class="swipe-content group relative flex items-center justify-between gap-3 border-b border-brand-200 dark:border-brand-700 px-3 py-2 transition-colors bg-brand-50 dark:bg-brand-900 hover:bg-brand-100 dark:hover:bg-brand-800 focus-within:ring-2 focus-within:ring-brand-500"
    class:swiping={isSwiping}
    style:--swipe-distance={swipeDistance}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
  >
    <div class="flex items-center gap-1">
      <!-- Drag handle -->
      <div
        use:dragHandle
        role="button"
        aria-label="drag handle for {item.title}"
        class="drag-handle flex items-center justify-center w-8 h-8 shrink-0 cursor-grab active:cursor-grabbing touch-manipulation text-brand-400 dark:text-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
        data-drag-handle
      >
        <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm9-14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <label for={checkboxId} class="group grid size-8 shrink-0 grid-cols-1 cursor-pointer">
        <input
          id={checkboxId}
          type="checkbox"
          class="col-start-1 row-start-1 m-auto size-4 appearance-none rounded border-2 border-brand-100 dark:border-brand-600 bg-white dark:bg-brand-600 checked:border-accent-2 checked:bg-accent-2 dark:checked:border-accent-4 dark:checked:bg-accent-4 shadow-[0_0_50px_0_#F2EFED] dark:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2 dark:focus-visible:outline-accent-4 cursor-pointer"
          checked={item.completed}
          aria-label={item.title}
          on:change={announceToggle}
          on:keydown={handleCheckboxKeydown}
        />
        <svg viewBox="0 0 20 20" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3 self-center justify-self-center stroke-white">
          <path d="M5 10L9 14L15 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
        </svg>
      </label>
      <label
        for={checkboxId}
        class={`text-base ${item.completed ? 'text-brand-400 dark:text-brand-500 line-through' : 'text-brand-900 dark:text-brand-100'}`}
      >
        {item.title}
      </label>
    </div>
    <button
      type="button"
      class="delete-on-hover inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-xl text-brand-400 dark:text-brand-500 transition-all duration-200 hover:text-brand-800 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`Remove ${item.title}`}
      on:click={announceDelete}
      on:keydown={handleDeleteKeydown}
    >
      <span aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6H18.9897C18.9959 5.99994 19.0021 5.99994 19.0083 6H21C21.5523 6 22 6.44772 22 7C22 7.55228 21.5523 8 21 8H19.9311L19.0638 20.1425C18.989 21.1891 18.1182 22 17.0689 22H6.93112C5.88184 22 5.01096 21.1891 4.9362 20.1425L4.06888 8H3C2.44772 8 2 7.55228 2 7C2 6.44772 2.44772 6 3 6H4.99174C4.99795 5.99994 5.00414 5.99994 5.01032 6H7V4ZM9 6H15V4H9V6ZM6.07398 8L6.93112 20H17.0689L17.926 8H6.07398ZM10 10C10.5523 10 11 10.4477 11 11V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5523 10 15 10.4477 15 11V17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V11C13 10.4477 13.4477 10 14 10Z" fill="currentColor"/>
        </svg>
      </span>
    </button>
  </div>
</div>
