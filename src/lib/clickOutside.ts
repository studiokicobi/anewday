/**
 * Svelte action for handling click-outside and escape key events
 */
export function clickOutside(node: HTMLElement) {
  const handleClick = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeydown, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeydown, true);
    },
  };
}
