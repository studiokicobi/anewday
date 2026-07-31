// Runs Lighthouse against a preview server this script owns.
//
// Previously this was a shell one-liner in package.json that started
// `vite preview` with no --port and then pointed wait-on and lighthouse at a
// hardcoded 4173. Two ways that went wrong once more than one checkout existed:
// vite silently moves to 4174+ when its default port is taken, so the report
// could be generated against another checkout's build, or the script could hang
// waiting on a port nothing of ours was ever listening on.
//
// Now: a per-checkout port (shared with playwright.config.ts), --strictPort so a
// clash fails loudly rather than drifting, and the server is torn down on every
// exit path.
import { spawn } from 'node:child_process';
import { previewPort } from './preview-port.js';

const port = previewPort();
const url = `http://127.0.0.1:${port}`;
const READY_TIMEOUT_MS = 30_000;

/** @type {import('node:child_process').ChildProcess | null} */
let preview = null;

function stopPreview() {
  if (preview && preview.exitCode === null && preview.signalCode === null) {
    preview.kill('SIGTERM');
  }
  preview = null;
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

    const ready = new RegExp(`http://127\\.0\\.0\\.1:${port}/?`);
    const watch = (stream, echo) => {
      stream?.on('data', (chunk) => {
        const text = String(chunk);
        echo.write(text);
        if (ready.test(text)) {
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
  // --strictPort: fail rather than drift to another port and profile whatever
  // else happens to be answering.
  preview = run(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  await waitForReady(preview);

  const lighthouse = run('npx', [
    'lighthouse',
    url,
    '--view',
    '--chrome-flags=--headless=new',
    '--output=json',
    '--output=html',
    '--output-path=./.lighthouse',
  ]);

  return exitCodeOf(lighthouse);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopPreview();
    process.exit(1);
  });
}

try {
  const code = await main();
  stopPreview();
  process.exit(code);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  stopPreview();
  process.exit(1);
}
