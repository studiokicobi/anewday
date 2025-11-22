// Type declarations for svelte-dnd-action custom events
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'on:consider'?: (event: CustomEvent<any>) => void;
    'on:finalize'?: (event: CustomEvent<any>) => void;
  }
}
