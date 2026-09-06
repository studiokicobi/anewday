// Runs Lighthouse against a preview server this script owns.
//
// Previously this was a shell one-liner in package.json that started
// `vite preview` with no --port and then pointed several processes at a
// hardcoded 4173. Two ways that went wrong once more than one checkout existed:
// vite silently moves to 4174+ when its default port is taken, so the report
// could be generated against another checkout's build, or the script could hang
// waiting on a port nothing of ours was ever listening on.
//
// Now: a per-checkout port (shared with playwright.config.ts), --strictPort so a
// clash fails loudly rather than drifting, and the server is torn down on every
// exit path.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { previewPort } from './preview-port.js';
import { createPreviewReadyMatcher } from './preview-readiness.js';
import { assertLighthouseReport } from './lighthouse-assertions.js';

const port = previewPort();
const url = `http://127.0.0.1:${port}`;
const READY_TIMEOUT_MS = 30_000;

/** @type {import('node:child_process').ChildProcess | null} */
let preview = null;

function signalProcessGroup(child, signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === 'win32') {
      child.kill(signal);
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

async function stopPreview() {
  const child = preview;
  preview = null;
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  const closed = new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve(undefined);
    } else {
      child.once('close', resolve);
    }
  });
  signalProcessGroup(child, 'SIGTERM');
  const timedOut = await Promise.race([
    closed.then(() => false),
    new Promise((resolve) => setTimeout(() => resolve(true), 3_000)),
  ]);
  if (timedOut) {
    signalProcessGroup(child, 'SIGKILL');
    await closed;
  }
}

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: 'inherit', shell: false, ...options });
}

/**
 * Resolves only when *our* vite says it is serving. Probing the URL instead
 * would accept any listener, and the listener that matters here is precisely
 * the one whose presence made vite refuse to start — another checkout serving
 * the very same app, which no response content can distinguish.
 *
 * @param {import('node:child_process').ChildProcess} child
 */
function waitForReady(child) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const timer = setTimeout(
      () =>
        finish(
          reject,
          new Error(`Preview server did not report ready within ${READY_TIMEOUT_MS}ms.`)
        ),
      READY_TIMEOUT_MS
    );

    const watch = (stream, echo) => {
      const isReady = createPreviewReadyMatcher(port);
      stream?.on('data', (chunk) => {
        const text = String(chunk);
        echo.write(text);
        if (isReady(text)) {
          finish(resolve, undefined);
        }
      });
    };
    watch(child.stdout, process.stdout);
    watch(child.stderr, process.stderr);

    child.on('exit', (code) =>
      finish(
        reject,
        new Error(
          `Preview server exited with code ${code} before serving ${url}. ` +
            `Something else is probably on port ${port}; set PREVIEW_PORT to pick another.`
        )
      )
    );
    child.on('error', (error) => finish(reject, error));
  });
}

function exitCodeOf(child) {
  return new Promise((resolve) => {
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

async function main() {
  console.log(`Starting preview on ${url}`);
  const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
  preview = run(
    process.execPath,
    [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' }
  );

  await waitForReady(preview);

  const lighthouseCli = fileURLToPath(
    new URL('../node_modules/lighthouse/cli/index.js', import.meta.url)
  );
  const lighthouse = run(process.execPath, [
    lighthouseCli,
    url,
    '--chrome-flags=--headless=new',
    '--quiet',
    '--output=json',
    '--output-path=./.lighthouse.report.json',
  ]);

  const code = await exitCodeOf(lighthouse);
  if (code !== 0) return code;

  const report = JSON.parse(await readFile('./.lighthouse.report.json', 'utf8'));
  const budgets = JSON.parse(await readFile('./budgets.json', 'utf8'));
  assertLighthouseReport(report, budgets);
  console.log('Lighthouse category and resource budget assertions passed.');
  return 0;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    void stopPreview().finally(() => process.exit(1));
  });
}

try {
  const code = await main();
  await stopPreview();
  process.exit(code);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await stopPreview();
  process.exit(1);
}
