<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import TodoItem from './TodoItem.svelte';
  import type { List, TodoItem as TodoItemType } from '../stores/state';

  const {
    list,
    items
  }: {
    list: List;
    items: TodoItemType[];
  } = $props();

  const dispatch = createEventDispatcher<{
    toggle: string;
    delete: string;
    reorder: { listId: string; items: TodoItemType[] };
    move: { sourceListId: string; targetListId: string; item: TodoItemType; targetIndex: number };
    touchdragstart: { item: TodoItemType; sourceIndex: number; sourceListId: string };
    touchdragover: { clientY: number; item: TodoItemType; sourceIndex: number; sourceListId: string };
    touchdragend: { clientY: number; item: TodoItemType; sourceIndex: number; sourceListId: string; cancelled?: boolean };
    keyboardcancel: { currentIndex: number; currentListId: string; originalIndex: number; originalListId: string; item: TodoItemType };
  }>();

  const flipDurationMs = 200;
  let isDragOverList = $state(false);

  function onToggle(event: CustomEvent<string>) {
    dispatch('toggle', event.detail);
  }

  function onDelete(event: CustomEvent<string>) {
    dispatch('delete', event.detail);
  }

  // Local optimistic state to prevent race conditions
  let localItems = $state(items);

  // Sync local state when items prop changes
  $effect(() => {
    localItems = items;
  });

  function onKeyboardMove(event: CustomEvent<{ direction: 'up' | 'down'; currentIndex: number; listId: string }>) {
    const { direction, currentIndex } = event.detail;

    // Use local state for immediate feedback
    if (direction === 'up' && currentIndex > 0) {
      const newItems = [...localItems];
      [newItems[currentIndex - 1], newItems[currentIndex]] = [newItems[currentIndex], newItems[currentIndex - 1]];
      localItems = newItems;
      dispatch('reorder', { listId: list.id, items: newItems });
    } else if (direction === 'down' && currentIndex < localItems.length - 1) {
      const newItems = [...localItems];
      [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
      localItems = newItems;
      dispatch('reorder', { listId: list.id, items: newItems });
    }
  }

  function onKeyboardCancel(event: CustomEvent<{
    currentIndex: number;
    currentListId: string;
    originalIndex: number;
    originalListId: string;
    item: TodoItemType;
  }>) {
    const { currentIndex, currentListId, originalIndex, originalListId } = event.detail;

    if (currentListId === originalListId && currentListId === list.id) {
      // Same list - just reorder back
      const newItems = [...localItems];
      const [movedItem] = newItems.splice(currentIndex, 1);
      newItems.splice(originalIndex, 0, movedItem);
      localItems = newItems;
      dispatch('reorder', { listId: list.id, items: newItems });
    } else {
      // Cross-list cancel - forward to App
      dispatch('keyboardcancel', event.detail);
    }
  }

  // Forward touch drag start event to App
  function onTouchDragStart(event: CustomEvent<{
    item: TodoItemType;
    sourceIndex: number;
    sourceListId: string;
  }>) {
    dispatch('touchdragstart', event.detail);
  }

  // Forward touch drag over event to App for insertion point calculation
  function onTouchDragOver(event: CustomEvent<{
    clientY: number;
    item: TodoItemType;
    sourceIndex: number;
    sourceListId: string;
  }>) {
    dispatch('touchdragover', event.detail);
  }

  // Forward touch drag end event to App for cross-list detection
  function onTouchDragEnd(event: CustomEvent<{
    clientY: number;
    item: TodoItemType;
    sourceIndex: number;
    sourceListId: string;
  }>) {
    dispatch('touchdragend', event.detail);
  }

  function handleDrop(event: CustomEvent<{
    sourceIndex: number;
    sourceListId: string;
    targetIndex: number;
    targetListId: string;
    sourceItem: TodoItemType;
  }>) {
    const { sourceIndex, sourceListId, targetIndex, targetListId, sourceItem } = event.detail;

    // Check if this is a cross-list move or same-list reorder
    if (sourceListId !== targetListId) {
      // Moving between lists
      dispatch('move', {
        sourceListId,
        targetListId,
        item: sourceItem,
        targetIndex
      });
    } else if (sourceListId === list.id) {
      // Reordering within same list
      if (sourceIndex !== targetIndex) {
        const newItems = [...localItems];
        const [movedItem] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, movedItem);

        localItems = newItems;
        dispatch('reorder', { listId: list.id, items: newItems });
      }
    }
  }

  function handleListDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOverList = true;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleListDragLeave() {
    isDragOverList = false;
  }

  function handleListDrop(e: DragEvent) {
    e.preventDefault();
    isDragOverList = false;

    if (e.dataTransfer) {
      try {
        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;

        const data = JSON.parse(dataStr);

        // Validate it's our app's drag data
        if (!data.index && data.index !== 0) return;
        if (!data.listId || !data.item) return;

        // Dropping into empty list or at the end
        if (data.listId !== list.id) {
          // Cross-list move to end
          dispatch('move', {
            sourceListId: data.listId,
            targetListId: list.id,
            item: data.item,
            targetIndex: localItems.length
          });
        } else {
          // Same-list move to end
          const sourceIndex = data.index;
          if (sourceIndex !== localItems.length - 1) {
            const newItems = [...localItems];
            const [movedItem] = newItems.splice(sourceIndex, 1);
            newItems.push(movedItem);
            localItems = newItems;
            dispatch('reorder', { listId: list.id, items: newItems });
          }
        }
      } catch (error) {
        console.warn('Invalid drop data:', error);
      }
    }
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
    <div
      role={localItems.length > 0 ? 'list' : undefined}
      aria-label={`${list.name} tasks drop zone`}
      id={`list-dropzone-${list.id}`}
      class="min-h-[4rem]"
      class:drag-over-list={isDragOverList}
      ondragover={handleListDragOver}
      ondragleave={handleListDragLeave}
      ondrop={handleListDrop}
    >
      {#if localItems.length === 0}
        <!-- Empty state -->
        <div
          class="min-h-[4rem] bg-white dark:bg-brand-800 rounded-lg border-2 border-dashed border-brand-200 dark:border-brand-700 flex items-center justify-center text-sm text-brand-500 dark:text-brand-400"
        >
          No items yet. Add one above.
        </div>
      {:else}
        {#each localItems as item, index (item.id)}
          <div animate:flip={{ duration: flipDurationMs }}>
            <div role="listitem">
              <TodoItem
                {item}
                {index}
                listId={list.id}
                isLast={index === localItems.length - 1}
                on:toggle={onToggle}
                on:delete={onDelete}
                on:drop={handleDrop}
                on:keyboardmove={onKeyboardMove}
                on:keyboardcancel={onKeyboardCancel}
                on:touchdragstart={onTouchDragStart}
                on:touchdragover={onTouchDragOver}
                on:touchdragend={onTouchDragEnd}
              />
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </section>
</div>
