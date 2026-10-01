import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPaths = [
  '.github/workflows/v6-phase1-build.yml',
  '.github/workflows/v6-database-ci.yml',
  '.github/workflows/v6-client-artifact-security.yml',
  '.github/workflows/v6-dependency-security.yml',
  '.github/workflows/v6-v4-rollback-reference.yml',
  '.github/workflows/v3-regression.yml',
];

const exactExpression =
  "${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || inputs.candidate_sha || github.sha }}";

test('every manually runnable RC component accepts and checks out one explicit exact candidate SHA', async () => {
  for (const path of workflowPaths) {
    const workflow = await readFile(new URL('../../' + path, import.meta.url), 'utf8');

    assert.match(
      workflow,
      /workflow_dispatch:\s*\n\s+inputs:\s*\n\s+candidate_sha:/,
      path + ' must expose candidate_sha for manual RC runs',
    );
    assert.ok(
      workflow.includes(exactExpression),
      path + ' must derive BQ_EXACT_SHA from PR head, explicit candidate_sha, then event SHA',
    );
    assert.ok(
      workflow.includes('run-name: RC ' + exactExpression),
      path + ' must expose the selected candidate SHA in the immutable workflow-run title',
    );

    assert.match(
      workflow,
      /BQ_EXACT_SHA:/,
      path + ' must bind the selected candidate in workflow environment',
    );
    assert.match(
      workflow,
      /ref:\s*\$\{\{ env\.BQ_EXACT_SHA \}\}/,
      path + ' must checkout the selected exact SHA',
    );
    assert.match(
      workflow,
      /\^\[0-9a-fA-F\]\{40\}\$/,
      path + ' must reject a non-full candidate SHA',
    );
    assert.match(
      workflow,
      /git rev-parse HEAD\)" = "\$\{BQ_EXACT_SHA\}"/,
      path + ' must prove checkout identity before certification work',
    );
  }
});
