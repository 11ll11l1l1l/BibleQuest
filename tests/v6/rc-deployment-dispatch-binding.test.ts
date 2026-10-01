import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('deployed-artifact verification exposes the exact candidate in its dispatch run title', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/v6-deployment-verify.yml', import.meta.url), 'utf8');
  const exactExpression = "${{ inputs.expected_sha || github.sha }}";

  assert.ok(
    workflow.includes('run-name: V6 Deployed Artifact Verification · RC ' + exactExpression),
    'deployment verification must bind its workflow run title to the exact expected SHA',
  );
  assert.ok(
    workflow.includes('BQ_EXPECTED_SHA: ' + exactExpression),
    'deployment verification title and checkout identity must derive from the same exact SHA expression',
  );
  assert.match(workflow, /ref:\s*\$\{\{ env\.BQ_EXPECTED_SHA \}\}/);
  assert.match(workflow, /git rev-parse HEAD\)" = "\$\{BQ_EXPECTED_SHA\}"/);
});
