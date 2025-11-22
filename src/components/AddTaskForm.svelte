<script lang="ts">
  import { tick } from 'svelte';
  import { clickOutside } from '../lib/clickOutside';
  import type { List } from '../stores/state';

  export let description: string;
  export let lists: List[];
  export let selectedList: string;
  export let onSubmit: () => Promise<void>;
  export let taskInput: HTMLInputElement | null = null;

  let showDropdown = false;
  let embeddedListTrigger: HTMLButtonElement | null = null;
  let addButton: HTMLButtonElement | null = null;
  let focusedListIndex = -1;
  let showError = false;

  function isEmbeddedListVisible() {
    return lists.length > 1;
  }

  function handleTaskInputFocus() {
  }

  function handleTaskInputKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' && event.altKey && isEmbeddedListVisible()) {
      event.preventDefault();
      void openDropdown();
    }

    // WebKit browsers (Safari, DuckDuckGo) have issues with Tab navigation
    // in forms with absolutely positioned elements, so we handle Tab explicitly
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      // If embedded list is visible, tab to it first, otherwise go to Add button
      if (isEmbeddedListVisible() && embeddedListTrigger) {
        embeddedListTrigger.focus();
      } else if (addButton) {
        addButton.focus();
      }
    }
  }

  function getOptionElement(index: number): HTMLButtonElement | null {
    if (typeof document === 'undefined') {
      return null;
    }
    const list = lists[index];
    if (!list) {
      return null;
    }
    return document.getElementById(`option-${list.id}`) as HTMLButtonElement | null;
  }

  function focusOptionByIndex(index: number) {
    if (index < 0 || index >= lists.length) {
      return;
    }
    focusedListIndex = index;
    const option = getOptionElement(index);
    option?.focus();
  }

  async function openDropdown(initialIndex?: number) {
    if (!lists.length) {
      return;
    }
    showDropdown = true;
    const selectedIndex = lists.findIndex(list => list.id === selectedList);
    const indexToFocus =
      typeof initialIndex === 'number' && initialIndex >= 0
        ? Math.min(initialIndex, lists.length - 1)
        : selectedIndex >= 0
          ? selectedIndex
          : 0;
    await tick();
    focusOptionByIndex(indexToFocus);
  }

  async function closeDropdown({ restoreFocusTo }: { restoreFocusTo?: 'trigger' | 'input' | 'add' } = {}) {
    if (!showDropdown) {
      return;
    }
    showDropdown = false;
    focusedListIndex = -1;
    if (!restoreFocusTo) {
      return;
    }

    await tick();
    // Use setTimeout for more reliable focus restoration across all browsers
    await new Promise(resolve => setTimeout(resolve, 10));
    if (restoreFocusTo === 'trigger') {
      embeddedListTrigger?.focus();
    } else if (restoreFocusTo === 'input') {
      taskInput?.focus();
    } else if (restoreFocusTo === 'add') {
      addButton?.focus();
    }
  }

  async function toggleDropdown() {
    if (showDropdown) {
      await closeDropdown();
    } else {
      await openDropdown();
    }
  }

  function handleAddButtonFocus() {
  }

  function handleAddButtonKeydown(event: KeyboardEvent) {
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();

      // If embedded list is visible, go back to it, otherwise go to input
      if (isEmbeddedListVisible() && embeddedListTrigger) {
        embeddedListTrigger.focus();
      } else {
        taskInput?.focus();
      }
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      // WebKit: explicitly handle Tab forward to next element
      event.preventDefault();
      // Query for next focusable element (first checkbox or settings button)
      const firstCheckbox = document.querySelector('input[type="checkbox"]') as HTMLElement;
      const settingsButton = document.querySelector('button[data-settings-trigger]') as HTMLElement;
      const nextElement = firstCheckbox || settingsButton;
      if (nextElement) {
        nextElement.focus();
      }
    }
  }

  // Handle keyboard navigation for embedded select
  async function handleEmbeddedSelectKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showDropdown) {
      event.preventDefault();
      await closeDropdown({ restoreFocusTo: 'trigger' });
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (showDropdown && focusedListIndex >= 0) {
        const targetList = lists[focusedListIndex];
        if (targetList) {
          await handleListSelection(targetList.id);
        }
      } else {
        await openDropdown();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (showDropdown) {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const currentIndex =
          focusedListIndex >= 0 ? focusedListIndex : lists.findIndex(list => list.id === selectedList);
        const nextIndex = Math.min(Math.max((currentIndex >= 0 ? currentIndex : 0) + delta, 0), lists.length - 1);
        focusOptionByIndex(nextIndex);
      } else {
        const indexToFocus = event.key === 'ArrowUp' ? lists.length - 1 : undefined;
        await openDropdown(indexToFocus);
      }
      return;
    }

    // WebKit: Handle Tab navigation when dropdown is not open
    if (event.key === 'Tab' && !showDropdown) {
      if (event.shiftKey) {
        event.preventDefault();
        taskInput?.focus();
      } else {
        event.preventDefault();
        addButton?.focus();
      }
    }
  }

  // Handle keyboard navigation within dropdown options
  async function handleDropdownOptionKeydown(event: KeyboardEvent, listId: string, index: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      await handleListSelection(listId);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = Math.min(Math.max(index + delta, 0), lists.length - 1);
      focusOptionByIndex(nextIndex);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusOptionByIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusOptionByIndex(lists.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      await closeDropdown({ restoreFocusTo: 'trigger' });
      return;
    }

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        event.preventDefault();
        await closeDropdown({ restoreFocusTo: 'input' });
      } else {
        event.preventDefault();
        await closeDropdown({ restoreFocusTo: 'add' });
      }
    }
  }

  // Enhanced list selection with focus management
  async function handleListSelection(listId: string) {
    selectedList = listId;
    await closeDropdown({ restoreFocusTo: 'trigger' });
  }

  // Handle click outside or escape key to close dropdown
  async function handleOutclick() {
    if (showDropdown) {
      await closeDropdown();
    }
  }

  async function handleFormSubmit() {
    // Validate that description is not empty
    if (!description.trim()) {
      showError = true;
      taskInput?.focus();
      return;
    }

    showError = false;
    await onSubmit();
    // Restore focus to Add button for better keyboard navigation flow
    await tick();
    addButton?.focus();
  }

  function handleInputChange() {
    // Clear error when user starts typing
    if (showError && description.trim()) {
      showError = false;
    }
  }

  // Get the selected list name for display
  $: selectedListName = lists.find(list => list.id === selectedList)?.name || 'Select List';
</script>

<section class="">
  <form class="flex flex-col gap-4" on:submit|preventDefault={handleFormSubmit}>
    <fieldset class="border-0 p-0 m-0">
      <legend class="sr-only">Add new task</legend>
      <div class="flex flex-col gap-0">
        <label class="sr-only" for="task">Add an item</label>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2" use:clickOutside on:outclick={handleOutclick}>
        <!-- Input group container -->
        <div class="relative flex-1">

          <!-- Text input -->
          <input
            id="task"
            name="task"
            class="w-full rounded-lg bg-white dark:bg-brand-700 hover:bg-white dark:hover:bg-brand-700 px-3 py-2 text-base text-brand-900 dark:text-brand-100 placeholder:text-brand-700 dark:placeholder:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-[0_0_50px_0_#F2EFED] dark:shadow-none"
            class:pr-24={lists.length > 1}
            class:ring-2={showError}
            class:ring-red-500={showError}
            class:dark:ring-red-400={showError}
            type="text"
            bind:value={description}
            bind:this={taskInput}
            on:input={handleInputChange}
            on:keydown={handleTaskInputKeydown}
            on:focus={handleTaskInputFocus}
            maxlength="160"
            autocomplete="off"
            placeholder="Today I will..."
            aria-label="Add an item to your daily checklist"
            aria-invalid={showError}
            aria-describedby={showError ? 'task-error' : undefined}
          />

          <!-- Embedded list selector (shown when multiple lists exist) -->
          {#if lists.length > 1}
            <div class="absolute inset-y-0 right-0 flex items-center pointer-events-none">
              <div class="relative h-full pointer-events-auto" use:clickOutside on:outclick={handleOutclick}>
                <label for="embedded-list-selector" class="sr-only">Choose list</label>
                <button
                  id="embedded-list-selector"
                  type="button"
                  role="combobox"
                  tabindex="0"
                  class="flex items-center justify-center gap-1 rounded-e-lg bg-transparent px-3 h-full text-xs text-brand-800 dark:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset pointer-events-auto"
                  aria-haspopup="listbox"
                  aria-expanded={showDropdown}
                  aria-controls="embedded-dropdown-listbox"
                  aria-activedescendant={showDropdown && focusedListIndex >= 0 ? `option-${lists[focusedListIndex]?.id}` : undefined}
                  bind:this={embeddedListTrigger}
                  on:click={() => void toggleDropdown()}
                  on:keydown={handleEmbeddedSelectKeydown}
                >
                  <span class="max-w-12 truncate">{selectedListName}</span>
                  <svg
                    class="h-3 w-3 text-brand-700 dark:text-brand-300 transition-transform duration-200"
                    class:rotate-180={showDropdown}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                <!-- Dropdown menu -->
                {#if showDropdown}
                  <div
                    id="embedded-dropdown-listbox"
                    class="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-brand-200 dark:border-brand-600 bg-white dark:bg-brand-800 overflow-hidden shadow-lg"
                    role="listbox"
                    aria-labelledby="embedded-list-selector"
                  >
                    {#each lists as list, index (list.id)}
                      <button
                        type="button"
                        id="option-{list.id}"
                        class="flex w-full items-center px-3 py-2 text-left text-sm text-brand-900 dark:text-brand-100 hover:bg-brand-200 dark:hover:bg-brand-700 focus-visible:bg-brand-100 dark:focus-visible:bg-brand-700 focus-visible:outline-none"
                        class:bg-brand-50={list.id === selectedList}
                        class:dark:bg-brand-900={list.id === selectedList}
                        class:text-brand-700={list.id === selectedList}
                        class:dark:text-brand-300={list.id === selectedList}
                        class:bg-brand-100={focusedListIndex === index}
                        class:dark:bg-brand-700={focusedListIndex === index}
                        role="option"
                        aria-selected={list.id === selectedList}
                        tabindex="-1"
                        on:click={async () => await handleListSelection(list.id)}
                        on:keydown={(event) => handleDropdownOptionKeydown(event, list.id, index)}
                        on:focus={() => {
                          focusedListIndex = index;
                        }}
                      >
                        <span class="flex-1">{list.name}</span>
                        {#if list.id === selectedList}
                          <svg class="h-3 w-3 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- Add button -->
        <button
          class="inline-flex items-center justify-center rounded-lg bg-accent-1 dark:bg-accent-3 px-4 py-2 text-base font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 dark:focus-visible:ring-accent-3 focus-visible:ring-offset-2"
          type="submit"
          bind:this={addButton}
          on:keydown={handleAddButtonKeydown}
          on:focus={handleAddButtonFocus}
        >
          Add
        </button>
        </div>

        <!-- Error message -->
        {#if showError}
          <div
            id="task-error"
            class="text-sm text-red-600 dark:text-red-400 px-1"
            role="alert"
          >
            Please add a task to continue.
          </div>
        {/if}
      </div>
      </div>
    </fieldset>
  </form>
</section>
