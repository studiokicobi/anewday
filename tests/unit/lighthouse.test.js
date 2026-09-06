import { describe, expect, it } from 'vitest';
import { assertLighthouseReport } from '../../scripts/lighthouse-assertions.js';

const budgets = [
  {
    path: '/*',
    resourceSizes: [{ resourceType: 'script', budget: 80 }],
    resourceCounts: [{ resourceType: 'script', budget: 10 }],
  },
];
function report(size = 80 * 1024, count = 10) {
  return {
    categories: {
      performance: { score: 0.95 },
      accessibility: { score: 1 },
      'best-practices': { score: 1 },
      seo: { score: 1 },
    },
    audits: {
      'resource-summary': {
        details: { items: [{ resourceType: 'script', transferSize: size, requestCount: count }] },
      },
    },
  };
}
describe('Lighthouse release assertions', () => {
  it('accepts scores and resource usage exactly at their limits', () => {
    expect(() => assertLighthouseReport(report(), budgets)).not.toThrow();
  });
  it('rejects resource size and count overruns independently', () => {
    expect(() => assertLighthouseReport(report(80 * 1024 + 1), budgets)).toThrow('transferSize');
    expect(() => assertLighthouseReport(report(0, 11), budgets)).toThrow('requestCount');
  });
  it('rejects a failed quality category even when resource budgets pass', () => {
    const result = report();
    result.categories.accessibility.score = 0.99;
    expect(() => assertLighthouseReport(result, budgets)).toThrow('accessibility');
  });
  it('fails closed when Lighthouse omits measurements or reports a runtime error', () => {
    expect(() => assertLighthouseReport({ ...report(), audits: {} }, budgets)).toThrow('missing');
    expect(() => assertLighthouseReport({ ...report(), categories: {} }, budgets)).toThrow('score');
    expect(() =>
      assertLighthouseReport(
        { ...report(), runtimeError: { message: 'Navigation failed' } },
        budgets
      )
    ).toThrow('Navigation failed');
  });
});
