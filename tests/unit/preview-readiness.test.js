import { describe, expect, it } from 'vitest';
import { createPreviewReadyMatcher } from '../../scripts/preview-readiness.js';

describe('preview readiness', () => {
  it('recognizes the colored URL emitted by Vite in CI', () => {
    const ready = createPreviewReadyMatcher(4173);
    expect(ready('  Local: \u001b[36mhttp://127.0.0.1:\u001b[1m4173\u001b[22m/\u001b[39m')).toBe(
      true
    );
  });
  it('accumulates URLs and ANSI sequences split across pipe chunks', () => {
    const ready = createPreviewReadyMatcher(4173);
    expect(ready('http://127.0.')).toBe(false);
    expect(ready('0.1:\u001b[')).toBe(false);
    expect(ready('1m4173\u001b[22m/')).toBe(true);
  });
  it('does not accept a different port or a partial URL', () => {
    const ready = createPreviewReadyMatcher(4173);
    expect(ready('http://127.0.0.1:41730/')).toBe(false);
    expect(ready('http://127.0.0.1:4173')).toBe(false);
    expect(ready('/')).toBe(true);
  });
});
