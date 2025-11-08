declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'on:outclick'?: (event: CustomEvent<void> & { currentTarget: EventTarget & T }) => void;
  }
}
