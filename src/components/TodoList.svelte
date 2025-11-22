<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dragHandleZone } from '../lib/dragHandle';
  import TodoItem from './TodoItem.svelte';
  import type { List, TodoItem as TodoItemType } from '../stores/state';

  export let list: List;
  export let items: TodoItemType[];

  const dispatch = createEventDispatcher<{
    toggle: string;
    delete: string;
    consider: { items: TodoItemType[]; info: any };
    finalize: { items: TodoItemType[]; info: any };
  }>();

  const flipDurationMs = 200;

  function onToggle(event: CustomEvent<string>) {
    dispatch('toggle', event.detail);
  }

  function onDelete(event: CustomEvent<string>) {
    dispatch('delete', event.detail);
  }

  function handleDndConsider(e: CustomEvent) {
    dispatch('consider', { items: e.detail.items, info: e.detail.info });
  }

  function handleDndFinalize(e: CustomEvent) {
    dispatch('finalize', { items: e.detail.items, info: e.detail.info });
  }
</script>

<div class="pt-4">
  <div class="mb-3">
    <!-- List title -->
    <h2 class="text-lg text-brand-800 dark:text-brand-300" id={`list-${list.id}`}>{list.name}</h2>
  </div>
  <!-- Always have a drop zone, even when empty -->
  <section
    aria-live="polite"
    aria-labelledby={`list-${list.id}`}
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="min-h-[4rem]"
      use:dragHandleZone={{ items, flipDurationMs }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#if items.length === 0}
        <!-- Empty state -->
        <div
          class="min-h-[4rem] bg-white dark:bg-brand-800 rounded-lg border-2 border-dashed border-brand-200 dark:border-brand-700 flex items-center justify-center text-sm text-brand-500 dark:text-brand-400"
        >
          No items yet. Add one above.
        </div>
      {:else}
        {#each items as item (item.id)}
          <div animate:flip={{ duration: flipDurationMs }}>
            <TodoItem
              {item}
              on:toggle={onToggle}
              on:delete={onDelete}
            />
          </div>
        {/each}
      {/if}
    </div>
  </section>
</div>
