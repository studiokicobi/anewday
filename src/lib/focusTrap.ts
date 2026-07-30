const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'details summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface FocusTrapOptions {
  initialFocus?: string | HTMLElement;
  returnFocus?: string | HTMLElement | (() => HTMLElement | null) | null;
  onEscape?: () => void;
}

function isFocusable(element: HTMLElement) {
  if (typeof window === 'undefined') {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.visibility === 'hidden' || style.display === 'none') {
    return false;
  }
  if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
}

function resolveElement(ref?: string | HTMLElement | null, container?: ParentNode) {
  if (!ref) return null;
  if (ref instanceof HTMLElement) return ref;
  if (typeof ref === 'string' && container) {
    return container.querySelector<HTMLElement>(ref);
  }
  return null;
}

export function focusTrap(node: HTMLElement, options: FocusTrapOptions = {}) {
  let previousFocus: HTMLElement | null =
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  let restoreTabIndex = false;

  const getFocusable = () =>
    Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(isFocusable);

  const focusInitial = () => {
    const initial = resolveElement(options.initialFocus ?? null, node) ?? getFocusable()[0];
    const target = initial ?? node;

    if (target === node && !node.hasAttribute('tabindex')) {
      node.setAttribute('tabindex', '-1');
      restoreTabIndex = true;
    }

    target.focus({ preventScroll: true });
  };

  const raf = requestAnimationFrame(focusInitial);

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      options.onEscape?.();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const current = document.activeElement as HTMLElement | null;
    const currentIndex = current ? focusable.indexOf(current) : -1;
    let nextIndex: number;

    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
    }

    event.preventDefault();
    focusable[nextIndex].focus();
  };

  node.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      node.removeEventListener('keydown', handleKeydown);

      if (restoreTabIndex) {
        node.removeAttribute('tabindex');
      }

      let focusTarget: HTMLElement | null = null;
      if (typeof options.returnFocus === 'function') {
        focusTarget = options.returnFocus();
      } else if (options.returnFocus) {
        const resolved = resolveElement(
          options.returnFocus as string | HTMLElement,
          node.ownerDocument?.documentElement ?? undefined
        );
        focusTarget = resolved;
      }

      if (!focusTarget) {
        focusTarget = previousFocus;
      }

      focusTarget?.focus({ preventScroll: true });
    },
  };
}

export type { FocusTrapOptions };
