interface Window {
  __anewdayRequestReset?: () => Promise<void>;
  __anewdaySetMode?: (mode: 'single' | 'multi') => Promise<void>;
}
