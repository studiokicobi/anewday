import { get, writable } from 'svelte/store';
import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';

const drag = writable(true);

export function dragHandleZone(node: HTMLElement, options: any) {
  let currentOptions = options;
  const zone = dndzone(node, {
    ...currentOptions,
    dragDisabled: true,
  });

  drag.subscribe((disabled) => {
    if (zone && zone.update) {
      zone.update({
        ...currentOptions,
        dragDisabled: disabled,
      });
    }
  });

  function consider(e: Event) {
    const customEvent = e as CustomEvent;
    const {
      info: { source, trigger },
    } = customEvent.detail;
    // Ensure dragging is stopped on drag finish via keyboard
    if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
      drag.set(true);
    }
  }

  function finalize(e: Event) {
    const customEvent = e as CustomEvent;
    const {
      info: { source },
    } = customEvent.detail;
    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      drag.set(true);
    }
  }

  node.addEventListener('consider', consider as EventListener);
  node.addEventListener('finalize', finalize as EventListener);

  return {
    update: (newOptions: any) => {
      currentOptions = newOptions;
      if (zone && zone.update) {
        zone.update({
          ...currentOptions,
          dragDisabled: get(drag),
        });
      }
    },
    destroy: () => {
      node.removeEventListener('consider', consider as EventListener);
      node.removeEventListener('finalize', finalize as EventListener);
      if (zone && zone.destroy) {
        zone.destroy();
      }
    },
  };
}

export function dragHandle(node: HTMLElement) {
  function startDrag(e: Event) {
    e.preventDefault();
    drag.set(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') drag.set(false);
  }

  drag.subscribe((disabled) => {
    node.tabIndex = disabled ? 0 : -1;
    node.style.cursor = disabled ? 'grab' : 'grabbing';
  });

  node.addEventListener('mousedown', startDrag);
  node.addEventListener('touchstart', startDrag);
  node.addEventListener('keydown', handleKeyDown);

  return {
    update: () => {},
    destroy: () => {
      node.removeEventListener('mousedown', startDrag);
      node.removeEventListener('touchstart', startDrag);
      node.removeEventListener('keydown', handleKeyDown);
    },
  };
}
