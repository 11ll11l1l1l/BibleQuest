import assert from 'node:assert/strict';
import test from 'node:test';

import {
  V4_ROLLBACK_BRANCH,
  V4_ROLLBACK_SHA,
  verifyV4RollbackReference,
} from '../../scripts/v6-v4-rollback-reference.mjs';

function responseFor({ sha = V4_ROLLBACK_SHA, type = 'commit', status = 200 } = {}) {
  return new Response(
    status === 200 ? JSON.stringify({ object: { sha, type } }) : 'not found',
    { status, headers: { 'content-type': 'application/json' } },
  );
}

test('V4 rollback guard accepts only the immutable recorded rollback SHA', async () => {
  let requested = '';
  const result = await verifyV4RollbackReference({
    repository: 'example/repo',
    token: 'test-token',
    fetchImpl: async input => {
      requested = String(input);
      return responseFor();
    },
  });

  assert.equal(result.branch, V4_ROLLBACK_BRANCH);
  assert.equal(result.sha, V4_ROLLBACK_SHA);
  assert.match(requested, /git\/ref\/heads\/rollback\/v4-pre-v5-production-20260918$/);
});

test('V4 rollback guard fails when the ref is missing', async () => {
  await assert.rejects(
    verifyV4RollbackReference({
      repository: 'example/repo',
      token: 'test-token',
      fetchImpl: async () => responseFor({ status: 404 }),
    }),
    /Required V4 rollback ref is missing/,
  );
});

test('V4 rollback guard fails if the rollback branch is repointed', async () => {
  await assert.rejects(
    verifyV4RollbackReference({
      repository: 'example/repo',
      token: 'test-token',
      fetchImpl: async () => responseFor({ sha: 'a'.repeat(40) }),
    }),
    /rollback ref moved/,
  );
});

test('V4 rollback guard rejects non-commit ref targets and API failures', async () => {
  await assert.rejects(
    verifyV4RollbackReference({
      repository: 'example/repo',
      token: 'test-token',
      fetchImpl: async () => responseFor({ type: 'tag' }),
    }),
    /must point to a commit/,
  );

  await assert.rejects(
    verifyV4RollbackReference({
      repository: 'example/repo',
      token: 'test-token',
      fetchImpl: async () => new Response('rate limited', { status: 403 }),
    }),
    /rollback ref query failed: HTTP 403/,
  );
});
