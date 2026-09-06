import { spawnSync } from 'node:child_process';

function audit(extraArguments = []) {
  const result = spawnSync('npm', ['audit', '--json', ...extraArguments], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.signal || ![0, 1].includes(result.status) || !result.stdout) {
    throw new Error(result.stderr || 'npm audit returned no report.');
  }
  const report = JSON.parse(result.stdout);
  if (report.error || !report.metadata?.vulnerabilities || !report.vulnerabilities) {
    throw new Error(
      report.message || report.error?.summary || result.stderr || 'npm audit returned no report.'
    );
  }
  return report;
}

function findingNames(report) {
  return Object.values(report.vulnerabilities ?? {})
    .map(({ name }) => name)
    .sort();
}

const productionFindings = findingNames(audit(['--omit=dev']));
if (productionFindings.length) {
  throw new Error(`Production audit findings: ${productionFindings.join(', ')}`);
}

const developmentFindings = findingNames(audit());
if (developmentFindings.length) {
  throw new Error(`Dependency audit findings: ${developmentFindings.join(', ')}`);
}

console.log('Production and development audits: zero findings.');
