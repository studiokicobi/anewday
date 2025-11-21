/**
 * Svelte action for SortableJS drag-and-drop functionality
 */
import Sortable from 'sortablejs';

interface SortableOptions {
  group?: string | { name: string; pull?: boolean; put?: boolean };
  animation?: number;
  onSort?: (evt: Sortable.SortableEvent) => void;
  onMove?: (evt: Sortable.MoveEvent) => void;
  filter?: Sortable.Options['filter'];
  preventOnFilter?: boolean;
}

const INTERACTIVE_FILTER = 'input, button, textarea, select, label, a, [role="button"], [role="link"], [data-prevent-drag]';

export function sortable(node: HTMLElement, options: SortableOptions = {}) {
  const sortableInstance = Sortable.create(node, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    filter: options.filter ?? INTERACTIVE_FILTER,
    preventOnFilter: options.preventOnFilter ?? false,
    touchStartThreshold: 10, // Require a small movement before initiating drag
    ...options,
  });

  return {
    update(newOptions: SortableOptions) {
      // Update sortable options if needed
      if (newOptions.onSort) {
        sortableInstance.option('onSort', newOptions.onSort);
      }
      if (newOptions.onMove) {
        sortableInstance.option('onMove', newOptions.onMove);
      }
      if (newOptions.filter) {
        sortableInstance.option('filter', newOptions.filter);
      }
      if (typeof newOptions.preventOnFilter === 'boolean') {
        sortableInstance.option('preventOnFilter', newOptions.preventOnFilter);
      }
    },
    destroy() {
      sortableInstance.destroy();
    },
  };
}
