import { describe, expect, it } from 'vitest';
import { dateKey, resetIfNeeded } from '../../src/lib/reset';

describe('reset utilities', () => {
  const baseState = {
    meta: { lastResetKey: '', settings: { mode: 'single' } },
    items: [
      { id: '1', completed: true },
      { id: '2', completed: false },
    ],
  };

  it('returns same reference when already reset today', () => {
    const today = dateKey();
    const state = { ...baseState, meta: { ...baseState.meta, lastResetKey: today } };
    const result = resetIfNeeded(state);
    expect(result).toBe(state);
  });

  it('clears completed flags and stamps date when needed', () => {
    const state = { ...baseState, meta: { ...baseState.meta, lastResetKey: '1970-01-01' } };
    const result = resetIfNeeded(state, new Date('1970-01-02T09:00:00'));
    expect(result.items.every((item) => item.completed === false)).toBe(true);
    expect(result.meta.lastResetKey).toBe('1970-01-02');
  });
});
