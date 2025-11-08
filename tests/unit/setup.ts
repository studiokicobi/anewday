import { expect } from 'vitest';

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
