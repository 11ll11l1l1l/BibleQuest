import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('V7 production convergence waits for the exact promoted SHA before byte verification', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/v7-release-convergence.yml', import.meta.url),
    'utf8',
  );
  for (const token of [
    "push:",
    "- main",
    "BQ_STRICT_RELEASE: ${{ github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && github.ref == 'refs/heads/main') || (github.event_name == 'pull_request' && github.event.pull_request.base.ref == 'main') }}",
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

test('every V7 main-target PR runs a strict exact-head release certification on relevant source changes', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/v7-release-convergence.yml', import.meta.url), 'utf8');
  const trigger = workflow.split('  pull_request:')[1]?.split('  workflow_dispatch:')[0];
  assert.ok(trigger, 'V7 PR trigger must exist');
  for (const token of [
    '- main', '- v7/development', "'src/**'", "'content/v7/**'",
    "'data/v7/**'", "'tests/v3-*.mjs'", "'tests/v4-*.mjs'",
    "'tests/v7/**'", "'offline-shell-sw.js'", "'vite.config.mjs'",
    "'index.html'", "'public/**'", "'assets/**'", "'scripts/v7-*.mjs'",
    "'.github/workflows/v7-*.yml'",
  ]) {
    assert.ok(trigger.includes(token), `main-bound V7 release trigger missing ${token}`);
  }
  assert.ok(workflow.includes("BQ_EXACT_SHA: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha"), 'PRs must certify the candidate head');
  assert.ok(workflow.includes("BQ_STRICT_RELEASE: ${{ github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && github.ref == 'refs/heads/main') || (github.event_name == 'pull_request' && github.event.pull_request.base.ref == 'main') }}"), 'main-target PR must be strict');
});

test('V7 strict mode differentiates development pushes from production promotion', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/v7-release-convergence.yml', import.meta.url), 'utf8');
  const [line] = workflow.split('\n').filter(item => item.trimStart().startsWith('BQ_STRICT_RELEASE:'));
  assert.equal(line?.trim(), "BQ_STRICT_RELEASE: ${{ github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && github.ref == 'refs/heads/main') || (github.event_name == 'pull_request' && github.event.pull_request.base.ref == 'main') }}");
  assert.match(line, /github\.event_name == 'workflow_dispatch'/);
  assert.match(line, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(line, /github\.event_name == 'pull_request' && github\.event\.pull_request\.base\.ref == 'main'/);
  assert.doesNotMatch(line, /github\.event_name != 'pull_request'/);
});
