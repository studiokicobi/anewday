<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TodoItem from './TodoItem.svelte';
  import type { List, TodoItem as TodoItemType } from '../stores/state';

  export let list: List;
  export let items: TodoItemType[];

  const dispatch = createEventDispatcher<{ toggle: string; delete: string }>();

  function onToggle(event: CustomEvent<string>) {
    dispatch('toggle', event.detail);
  }

  function onDelete(event: CustomEvent<string>) {
    dispatch('delete', event.detail);
  }
</script>

<section class="pt-4" aria-labelledby={`list-${list.id}`}>
  <div class="mb-3">
    <!-- List title -->
    <h2 class="text-lg text-brand-800 dark:text-brand-200" id={`list-${list.id}`}>{list.name}</h2>
  </div>
  {#if items.length === 0}
  <!-- Empty state -->
    <div
      class="min-h-[4rem] bg-white dark:bg-brand-800 rounded-lg border-2 border-dashed border-brand-200 dark:border-brand-700 flex items-center justify-center text-sm text-brand-500 dark:text-brand-400"
    >
      No items yet. Add one above.
    </div>
  {:else}
    <ul
      class="flex flex-col gap-0"
      aria-live="polite"
    >
      {#each items as item (item.id)}
        <li>
          <TodoItem
            {item}
            on:toggle={onToggle}
            on:delete={onDelete}
          />
        </li>
      {/each}
    </ul>
  {/if}
</section>
