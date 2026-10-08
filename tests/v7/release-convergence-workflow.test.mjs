import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('V7 production convergence waits for the exact promoted SHA before byte verification', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/v7-release-convergence.yml', import.meta.url),
    'utf8',
  );
  for (const token of [
    "pull_request:",
    "push:",
    "- v7/development",
    "offline-shell-sw.js",
    "vite.config.mjs",
    "scripts/v7-*.mjs",
    "- main",
    "BQ_STRICT_RELEASE: ${{ github.event_name != 'pull_request' || github.event.pull_request.base.ref == 'main' }}",
    "https://mybiblequest.pages.dev/bq-build.json",
    "Production now serves exact candidate",
    "Production did not promote exact candidate",
    "node scripts/v6-deployment-verify.mjs",
    "node scripts/v6-live-smoke.mjs",
    "production-release-certification.json",
  ]) {
    assert.ok(workflow.includes(token), `release convergence workflow missing: ${token}`);
  }
});
