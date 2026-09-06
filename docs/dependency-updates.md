# Dependency updates

Dependabot opens weekly npm and GitHub Actions updates on Thursdays at 06:00
Europe/Stockholm. GitHub also opens eligible Dependabot security update PRs.

The `Dependabot auto-merge` workflow enables squash auto-merge for verified,
non-draft Dependabot PRs from this repository targeting `main` when their npm
updates are all classified as patch or minor. A grouped update containing a major
change stays manual. GitHub Actions updates and updates with missing metadata
also stay manual. Security fixes use the same patch/minor policy.

The workflow runs on `pull_request_target` so it can enable auto-merge with the
built-in `GITHUB_TOKEN`. It never checks out or executes pull request code, and
the metadata action is pinned to a verified release commit. No personal access
token or additional secret is needed.

Keep repository auto-merge enabled and the `Protect main` ruleset active with no
bypass actors. It requires a pull request, an up-to-date branch, and these checks:

- `build-test-audit` from GitHub Actions
- `CodeQL` from GitHub Advanced Security
- `netlify/anewday/deploy-preview` from Netlify

Required approvals are set to zero so eligible updates can merge unattended.
Failed or pending checks block merging. Investigate failed checks on the PR;
the workflow does not repair code, dismiss alerts, or bypass the ruleset.

Major updates require manual review and validation. TypeScript 7 is temporarily
excluded because Svelte Check and typescript-eslint do not support it, and Node
type definitions remain on the Node 22 major used by the repository.

To pause automatic dependency merges, disable the `Dependabot auto-merge`
workflow in GitHub Actions and disable auto-merge on any PRs already queued.
Dependabot will continue opening PRs for review.
