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

// Focus only restores to an element that is still in the document and still
// focusable. Calling focus() on a detached or hidden element does not fail
// loudly -- it drops focus to <body>.
function canRestoreFocusTo(element: HTMLElement | null): boolean {
  return !!element && element.isConnected && isFocusable(element);
}

function resolveElement(ref?: string | HTMLElement | null, container?: ParentNode) {
  if (!ref) return null;
  if (ref instanceof HTMLElement) return ref;
  if (typeof ref === 'string' && container) {
    return container.querySelector<HTMLElement>(ref);
  }
  return null;
}

export function focusTrap(node: HTMLElement, initialOptions: FocusTrapOptions = {}) {
  const doc = node.ownerDocument;
  // Options are re-supplied through update(). Prefer passing `returnFocus` as a
  // bare value over a `() => prop` getter: a getter hides the prop read inside a
  // closure the compiler cannot see, so Svelte has no reason to keep that prop
  // current, and the trap then restores focus to a stale initial value (usually
  // null) when it unmounts.
  let options = initialOptions;
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
    update(nextOptions: FocusTrapOptions = {}) {
      options = nextOptions;
    },
    destroy() {
      cancelAnimationFrame(raf);
      node.removeEventListener('keydown', handleKeydown);

      if (restoreTabIndex) {
        node.removeAttribute('tabindex');
      }

      const resolveReturnTarget = () => {
        let target: HTMLElement | null = null;
        if (typeof options.returnFocus === 'function') {
          target = options.returnFocus();
        } else if (options.returnFocus) {
          target = resolveElement(
            options.returnFocus as string | HTMLElement,
            node.ownerDocument?.documentElement ?? undefined
          );
        }
        return canRestoreFocusTo(target) ? target : previousFocus;
      };

      const restore = () => {
        const target = resolveReturnTarget();
        if (canRestoreFocusTo(target)) {
          target!.focus({ preventScroll: true });
          return true;
        }
        return false;
      };

      restore();

      // The element we just focused may be re-rendered away moments later, and
      // focus then falls to <body> with nothing to catch it -- which leaves any
      // surviving trap underneath inert, since Escape is bound to its node
      // rather than to document. Re-resolve and retry once the DOM settles;
      // update() keeps `options` current, so this yields the replacement element.
      let retries = 2;
      const verify = () => {
        if (retries-- <= 0) return;
        const active = doc?.activeElement;
        if (active && active !== doc?.body) return;
        if (!restore()) return;
        requestAnimationFrame(verify);
      };
      requestAnimationFrame(verify);
    },
  };
}

export type { FocusTrapOptions };
