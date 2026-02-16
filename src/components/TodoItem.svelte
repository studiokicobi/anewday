<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TodoItem as TodoItemType } from '../stores/state';

  const {
    item,
    index,
    listId,
    isLast = false
  }: {
    item: TodoItemType;
    index: number;
    listId: string;
    isLast?: boolean;
  } = $props();

  const dispatch = createEventDispatcher<{
    toggle: string;
    delete: string;
    dragstart: { index: number; listId: string; item: TodoItemType };
    dragover: { index: number; listId: string };
    drop: { sourceIndex: number; sourceListId: string; targetIndex: number; targetListId: string; sourceItem: TodoItemType };
    keyboardmove: { direction: 'up' | 'down'; currentIndex: number; listId: string };
    keyboardcancel: { currentIndex: number; currentListId: string; originalIndex: number; originalListId: string; item: TodoItemType };
    touchdragstart: { item: TodoItemType; sourceIndex: number; sourceListId: string };
    touchdragover: { clientY: number; item: TodoItemType; sourceIndex: number; sourceListId: string };
    touchdragend: { clientY: number; item: TodoItemType; sourceIndex: number; sourceListId: string; cancelled?: boolean };
  }>();
  const checkboxId = `todo-${item.id}`;

  let isDragging = $state(false);
  let isDragOver = $state(false);
  let isDragAllowed = $state(false);
  let isKeyboardGrabbed = $state(false);
  let isTouchDragging = $state(false);
  let touchDragStartY = $state(0);
  let touchDragCurrentY = $state(0);
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let originalPosition = $state<{ index: number; listId: string } | null>(null);

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    isDragAllowed = Boolean(target.closest('.drag-handle'));
  }

  function handleHandleKeyDown(e: KeyboardEvent) {
    // Enter or Space to grab/drop
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isKeyboardGrabbed = !isKeyboardGrabbed;

      if (isKeyboardGrabbed) {
        // Save original position for potential cancel
        originalPosition = { index, listId };
        // Grabbed - announce to screen readers
        announceToScreenReader(`Grabbed ${item.title}. Use arrow keys to move, Enter or Space to drop, Escape to cancel.`);
      } else {
        // Dropped - clear original position
        originalPosition = null;
        announceToScreenReader(`Dropped ${item.title}.`);
      }
      return;
    }

    // Arrow keys to move when grabbed
    if (isKeyboardGrabbed) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveItemUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveItemDown();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        isKeyboardGrabbed = false;

        // Restore to original position if it changed
        if (originalPosition && (originalPosition.index !== index || originalPosition.listId !== listId)) {
          dispatch('keyboardcancel', {
            currentIndex: index,
            currentListId: listId,
            originalIndex: originalPosition.index,
            originalListId: originalPosition.listId,
            item
          });
          announceToScreenReader(`Cancelled move. Returned ${item.title} to original position.`);
        } else {
          announceToScreenReader(`Cancelled.`);
        }
        originalPosition = null;
      }
    }
  }

  function moveItemUp() {
    if (index === 0) {
      announceToScreenReader('Already at top.');
      return;
    }

    dispatch('keyboardmove', {
      direction: 'up',
      currentIndex: index,
      listId
    });
    announceToScreenReader(`Moved ${item.title} up.`);
  }

  function moveItemDown() {
    if (isLast) {
      announceToScreenReader('Already at bottom.');
      return;
    }

    dispatch('keyboardmove', {
      direction: 'down',
      currentIndex: index,
      listId
    });
    announceToScreenReader(`Moved ${item.title} down.`);
  }

  function announceToScreenReader(message: string) {
    // Create or update live region for screen reader announcements
    let liveRegion = document.getElementById('sr-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'sr-live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = message;
  }

  function handleDragStart(e: DragEvent) {
    // Only allow dragging if mouse was down on drag handle
    if (!isDragAllowed) {
      e.preventDefault();
      return;
    }

    isDragging = true;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        index,
        listId,
        item
      }));
    }
    dispatch('dragstart', { index, listId, item });
  }

  function handleDragEnd() {
    isDragging = false;
    isDragAllowed = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    isDragOver = true;
    dispatch('dragover', { index, listId });
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;

    if (e.dataTransfer) {
      try {
        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return; // External drag with no data

        const data = JSON.parse(dataStr);

        // Validate it's our app's drag data
        if (!data.index && data.index !== 0) return;
        if (!data.listId || !data.item) return;

        dispatch('drop', {
          sourceIndex: data.index,
          sourceListId: data.listId,
          targetIndex: index,
          targetListId: listId,
          sourceItem: data.item
        });
      } catch (error) {
        // External drag or malformed data - ignore
        console.warn('Invalid drop data:', error);
      }
    }
  }

  const announceToggle = () => dispatch('toggle', item.id);
  const announceDelete = () => dispatch('delete', item.id);

  // Swipe-to-delete state
  let touchStartX = $state(0);
  let touchCurrentX = $state(0);
  let isSwiping = $state(false);
  let swipeDistance = $state(0);
  let touchStartedOnInteractive = $state(false);
  const SWIPE_THRESHOLD = 100; // Distance in pixels to trigger delete

  const INTERACTIVE_SELECTOR = 'input,button,label,a,[role="button"],[role="link"]';

  function isInteractiveTarget(target: EventTarget | null) {
    let node: HTMLElement | null = null;
    if (target instanceof HTMLElement) {
      node = target;
    } else if (target instanceof Node) {
      node = target.parentElement;
    }
    return node ? Boolean(node.closest(INTERACTIVE_SELECTOR)) : false;
  }

  function isDragHandleTarget(target: EventTarget | null): boolean {
    let node: HTMLElement | null = null;
    if (target instanceof HTMLElement) {
      node = target;
    } else if (target instanceof Node) {
      node = target.parentElement;
    }
    return node ? Boolean(node.closest('.drag-handle')) : false;
  }

  function handleTouchStart(event: TouchEvent) {
    const isDragHandle = isDragHandleTarget(event.target);

    if (isDragHandle) {
      // Long press to start drag on handle
      touchDragStartY = event.touches[0].clientY;
      longPressTimer = setTimeout(() => {
        isTouchDragging = true;
        navigator.vibrate?.(50); // Haptic feedback if supported
        dispatch('touchdragstart', {
          item,
          sourceIndex: index,
          sourceListId: listId
        });
      }, 500); // 500ms long press
      return;
    }

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
    // Handle touch drag
    if (isTouchDragging) {
      event.preventDefault();
      touchDragCurrentY = event.touches[0].clientY;

      // Dispatch touchdragover for precise insertion calculation
      dispatch('touchdragover', {
        clientY: touchDragCurrentY,
        item,
        sourceIndex: index,
        sourceListId: listId
      });

      const deltaY = touchDragCurrentY - touchDragStartY;

      // Threshold to trigger move
      if (Math.abs(deltaY) > 40) {
        if (deltaY < 0) {
          // Dragging up
          moveItemUp();
        } else {
          // Dragging down
          moveItemDown();
        }
        touchDragStartY = touchDragCurrentY;
      }
      return;
    }

    // Cancel long press if moved before timeout
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

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
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // End touch drag
    if (isTouchDragging) {
      // Dispatch touch drag end event with final position for cross-list detection
      const finalY = event.changedTouches[0]?.clientY ?? touchDragCurrentY;
      dispatch('touchdragend', {
        clientY: finalY,
        item,
        sourceIndex: index,
        sourceListId: listId,
        cancelled: false
      });

      isTouchDragging = false;
      touchDragStartY = 0;
      touchDragCurrentY = 0;
      return;
    }

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

  function handleTouchCancel(_event: TouchEvent) {
    // Handle touch cancellation (e.g., phone call, notification)
    if (isTouchDragging) {
      dispatch('touchdragend', {
        clientY: 0,
        item,
        sourceIndex: index,
        sourceListId: listId,
        cancelled: true
      });
      isTouchDragging = false;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
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
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    role="group"
    aria-label="Task: {item.title}"
    draggable="true"
    class="swipe-content group relative flex items-center justify-between gap-3 border-b border-brand-200 dark:border-brand-700 px-3 py-2 transition-colors bg-brand-50 dark:bg-brand-900 hover:bg-brand-100 dark:hover:bg-brand-800 focus-within:ring-2 focus-within:ring-brand-500"
    class:swiping={isSwiping}
    class:dragging={isDragging}
    class:drag-over={isDragOver}
    style:--swipe-distance={swipeDistance}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    ontouchcancel={handleTouchCancel}
    onmousedown={handleMouseDown}
    ondragstart={handleDragStart}
    ondragend={handleDragEnd}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="flex items-center gap-1">
      <!-- Drag handle -->
      <div
        role="button"
        tabindex="0"
        aria-label="Drag handle for {item.title}. Press Enter or Space to grab."
        aria-grabbed={isKeyboardGrabbed}
        class="drag-handle flex items-center justify-center w-8 h-8 shrink-0 cursor-grab active:cursor-grabbing touch-manipulation text-brand-400 dark:text-brand-300 hover:text-brand-600 dark:hover:text-brand-200"
        class:keyboard-grabbed={isKeyboardGrabbed}
        data-drag-handle
        onkeydown={handleHandleKeyDown}
      >
        <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm9-14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <label for={checkboxId} class="group grid size-8 shrink-0 grid-cols-1 cursor-pointer pointer-events-auto">
        <input
          id={checkboxId}
          type="checkbox"
          class="col-start-1 row-start-1 m-auto size-4 appearance-none rounded border-0 bg-brand-100 dark:bg-brand-600 checked:bg-brand-900 dark:checked:bg-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900 dark:focus-visible:outline-brand-300 cursor-pointer pointer-events-auto"
          checked={item.completed}
          aria-label={item.title}
          onchange={announceToggle}
          onkeydown={handleCheckboxKeydown}
        />
        <svg viewBox="0 0 20 20" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3 self-center justify-self-center stroke-white">
          <path d="M5 10L9 14L15 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
        </svg>
      </label>
      <label
        for={checkboxId}
        class={`text-base ${item.completed ? 'text-brand-700 dark:text-brand-300 line-through' : 'text-brand-600 dark:text-brand-100'}`}
      >
        {item.title}
      </label>
    </div>
    <button
      type="button"
      class="delete-on-hover inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-xl text-brand-200 dark:text-brand-300 transition-all duration-200 hover:text-brand-400 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 pointer-events-auto"
      aria-label={`Remove ${item.title}`}
      onclick={announceDelete}
      onkeydown={handleDeleteKeydown}
    >
      <span aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6H18.9897C18.9959 5.99994 19.0021 5.99994 19.0083 6H21C21.5523 6 22 6.44772 22 7C22 7.55228 21.5523 8 21 8H19.9311L19.0638 20.1425C18.989 21.1891 18.1182 22 17.0689 22H6.93112C5.88184 22 5.01096 21.1891 4.9362 20.1425L4.06888 8H3C2.44772 8 2 7.55228 2 7C2 6.44772 2.44772 6 3 6H4.99174C4.99795 5.99994 5.00414 5.99994 5.01032 6H7V4ZM9 6H15V4H9V6ZM6.07398 8L6.93112 20H17.0689L17.926 8H6.07398ZM10 10C10.5523 10 11 10.4477 11 11V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5523 10 15 10.4477 15 11V17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V11C13 10.4477 13.4477 10 14 10Z" fill="currentColor"/>
        </svg>
      </span>
    </button>
  </div>
</div>

<style>
  .keyboard-grabbed {
    outline: 2px solid #2C303A;
    outline-offset: 2px;
    background-color: rgba(44, 48, 58, 0.1);
  }
</style>
