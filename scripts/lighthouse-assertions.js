// Lighthouse 13 no longer emits the performance-budget audit. Enforce the
// existing budgets against its resource summary instead.
export function assertLighthouseReport(report, budgets) {
  if (report.runtimeError) throw new Error(report.runtimeError.message);
  for (const [category, minimum] of Object.entries({
    performance: 0.95,
    accessibility: 1,
    'best-practices': 1,
    seo: 1,
  })) {
    const score = report.categories?.[category]?.score;
    if (!Number.isFinite(score) || score < minimum) {
      throw new Error(`Lighthouse ${category} score ${String(score)} is below ${minimum}.`);
    }
  }
  if (budgets.length !== 1 || budgets[0].path !== '/*') {
    throw new Error('Expected one site-wide Lighthouse resource budget.');
  }
  const resources = report.audits?.['resource-summary']?.details?.items;
  if (!Array.isArray(resources)) throw new Error('Lighthouse resource summary is missing.');
  for (const [kind, field, multiplier] of [
    ['resourceSizes', 'transferSize', 1024],
    ['resourceCounts', 'requestCount', 1],
  ]) {
    for (const { resourceType, budget } of budgets[0][kind] ?? []) {
      const value = resources.find((entry) => entry.resourceType === resourceType)?.[field];
      if (
        !Number.isFinite(budget) ||
        budget < 0 ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > budget * multiplier
      ) {
        throw new Error(
          `Lighthouse ${resourceType} ${field} ${String(value)} exceeds budget ${budget * multiplier} or is missing.`
        );
      }
    }
  }
}
