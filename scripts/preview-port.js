import { createHash } from 'node:crypto';

// Shared by playwright.config.ts and scripts/lighthouse.js so the two cannot
// drift onto different ports.
//
// Every checkout gets its own preview port, derived from its path. Agent
// worktrees under .claude/worktrees/ are full checkouts, so several copies of
// this repo can run a preview at once. On a shared port they serve each other's
// dist/ and tear each other's server down mid-run, which surfaces as a
// connection error and reads as a test failure rather than a collision.
//
// CI has a single checkout, so it keeps the well-known port.
export const BASE_PORT = 4173;

// 4173-4372, clear of vite's 5173 dev server and the 5180 in launch.json.
const PORT_SPREAD = 200;

/**
 * @param {{ env?: NodeJS.ProcessEnv, cwd?: string }} [options]
 * @returns {number} the preview port this checkout should use
 */
export function previewPort({ env = process.env, cwd = process.cwd() } = {}) {
  const override = env.PREVIEW_PORT ?? env.PLAYWRIGHT_PORT;
  if (override) {
    return Number(override);
  }
  if (env.CI) {
    return BASE_PORT;
  }
  return BASE_PORT + (createHash('sha1').update(cwd).digest().readUInt16BE(0) % PORT_SPREAD);
}
