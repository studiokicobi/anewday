<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let item: { id: string; title: string; completed: boolean };

  const dispatch = createEventDispatcher<{ toggle: string; delete: string }>();
  const checkboxId = `todo-${item.id}`;

  const announceToggle = () => dispatch('toggle', item.id);
  const announceDelete = () => dispatch('delete', item.id);

  function handleCheckboxKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Allow Enter to toggle checkbox (in addition to Space which is default)
      // Space is handled automatically by the browser
      event.preventDefault();
      announceToggle();
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
    if (event.key === 'Tab' && !event.shiftKey) {
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
        const settingsBtn = document.querySelector('button[aria-haspopup="dialog"]') as HTMLElement;
        settingsBtn?.focus();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      const checkbox = (event.currentTarget as HTMLElement).closest('.todo-item')?.querySelector('input[type="checkbox"]') as HTMLElement;
      checkbox?.focus();
    }
  }
</script>

<div class="todo-item flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
  <div class="flex items-start gap-3">
    <input
      id={checkboxId}
      type="checkbox"
      class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      checked={item.completed}
      aria-label={item.title}
      on:change={announceToggle}
      on:keydown={handleCheckboxKeydown}
    />
    <label
      for={checkboxId}
      class={`text-base ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
    >
      {item.title}
    </label>
  </div>
  <button
    type="button"
    class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
    aria-label={`Remove ${item.title}`}
    on:click={announceDelete}
    on:keydown={handleDeleteKeydown}
  >
    <span aria-hidden="true">×</span>
  </button>
</div>
