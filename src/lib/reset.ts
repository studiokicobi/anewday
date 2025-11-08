/**
 * Helpers for computing daily reset boundaries and scheduling midnight refreshes.
 */

export interface ResettableState {
  meta: { lastResetKey: string };
  items: Array<{ completed: boolean }>;
}

/** Returns the local date in YYYY-MM-DD, suitable as a daily reset key. */
export function dateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Calculates milliseconds until the next local midnight boundary. */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

/** Schedules a callback to run at the next midnight and returns a cancel handle. */
export function scheduleMidnight(callback: () => void): () => void {
  const timer = setTimeout(callback, msUntilNextMidnight());
  return () => clearTimeout(timer);
}

/** Clears completed flags and stamps today when the stored reset key is stale. */
export function resetIfNeeded<T extends ResettableState>(state: T, now: Date = new Date()): T {
  const today = dateKey(now);
  if (state.meta.lastResetKey === today) {
    return state;
  }

  const items = state.items.map((item) => (item.completed ? { ...item, completed: false } : item));
  return {
    ...state,
    meta: { ...state.meta, lastResetKey: today },
    items,
  };
}
