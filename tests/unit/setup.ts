import { expect, vi } from 'vitest';

// Basic expect extension for number closeness if needed in future
expect.extend({
  toBeWithin(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} to be within [${floor}, ${ceiling}]`,
    };
  },
});

function createStorageMock(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key) {
      return data.get(String(key)) ?? null;
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key) {
      data.delete(String(key));
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
  };
}

// Avoid depending on host-provided Web Storage implementations in tests.
if (typeof window !== 'undefined') {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: sessionStorageMock,
  });

  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('sessionStorage', sessionStorageMock);
}
