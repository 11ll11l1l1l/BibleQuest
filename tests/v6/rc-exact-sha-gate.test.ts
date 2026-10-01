import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_REQUIRED_WORKFLOWS,
  collectExactShaRcEvidence,
  normalizeCandidateSha,
} from '../../scripts/v6-rc-exact-sha-gate.mjs';

const candidateSha = 'a'.repeat(40);

function successRun(name, id) {
  return {
    id,
    name,
    head_sha: candidateSha,
    status: 'completed',
    conclusion: 'success',
    event: 'workflow_dispatch',
    html_url: `https://github.com/example/repo/actions/runs/${id}`,
    updated_at: '2026-10-01T10:00:00Z',
  };
}

function fetchFor(runs) {
  return async input => {
    const url = input instanceof URL ? input : new URL(input);
    assert.equal(url.searchParams.get('head_sha'), candidateSha);
    return new Response(JSON.stringify({ workflow_runs: runs }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

test('RC collector includes the immutable V4 rollback-reference guard', () => {
  assert.ok(DEFAULT_REQUIRED_WORKFLOWS.includes('V6 V4 Rollback Reference Guard'));
});

test('RC collector requires an exact full SHA', () => {
  assert.equal(normalizeCandidateSha(candidateSha.toUpperCase()), candidateSha);
  assert.throws(() => normalizeCandidateSha('abc1234'), /exact 40-character candidate SHA/);
});

test('RC collector passes only when every required automated gate succeeded on the exact candidate', async () => {
  const runs = DEFAULT_REQUIRED_WORKFLOWS.map((name, index) => successRun(name, 1000 + index));
  runs.push({
    ...successRun('V6 Phase 1 Build Gate', 900),
    head_sha: 'b'.repeat(40),
  });

  const evidence = await collectExactShaRcEvidence({
    repository: 'example/repo',
    candidateSha,
    token: 'test-token',
    fetchImpl: fetchFor(runs),
    now: () => new Date('2026-10-01T10:05:00Z'),
  });

  assert.equal(evidence.candidateSha, candidateSha);
  assert.equal(evidence.requiredWorkflowCount, DEFAULT_REQUIRED_WORKFLOWS.length);
  assert.deepEqual(
    evidence.workflows.map(item => item.workflow),
    DEFAULT_REQUIRED_WORKFLOWS,
  );
  assert.ok(evidence.workflows.every(item => item.runId >= 1000));
});

test('RC collector fails closed when any required exact-SHA workflow is absent or non-success', async () => {
  const runs = DEFAULT_REQUIRED_WORKFLOWS
    .filter(name => name !== 'V6 Database CI')
    .map((name, index) => successRun(name, 2000 + index));
  runs.push({
    ...successRun('V6 Database CI', 2999),
    conclusion: 'failure',
  });

  await assert.rejects(
    collectExactShaRcEvidence({
      repository: 'example/repo',
      candidateSha,
      token: 'test-token',
      fetchImpl: fetchFor(runs),
    }),
    /Missing exact-SHA SUCCESS: V6 Database CI/,
  );
});

test('RC collector rejects GitHub API failures rather than manufacturing evidence', async () => {
  await assert.rejects(
    collectExactShaRcEvidence({
      repository: 'example/repo',
      candidateSha,
      token: 'test-token',
      fetchImpl: async () => new Response('rate limited', { status: 403 }),
    }),
    /GitHub Actions evidence query failed: HTTP 403/,
  );
});
