const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export const V4_ROLLBACK_BRANCH = 'rollback/v4-pre-v5-production-20260918';
export const V4_ROLLBACK_SHA = '95d45c18aed3dbb9862749d73749b571fceaa66e';

function normalizeRepository(value) {
  const repository = String(value || '').trim();
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new Error('V4 rollback verification requires GITHUB_REPOSITORY in owner/name form.');
  }
  return repository;
}

function normalizeExpectedSha(value = V4_ROLLBACK_SHA) {
  const sha = String(value || '').trim().toLowerCase();
  if (!SHA_PATTERN.test(sha)) {
    throw new Error('V4 rollback verification requires an exact 40-character expected SHA.');
  }
  return sha;
}

function rollbackRefUrl(repository, branch = V4_ROLLBACK_BRANCH) {
  const encoded = branch.split('/').map(encodeURIComponent).join('/');
  return new URL(`https://api.github.com/repos/${repository}/git/ref/heads/${encoded}`);
}

export async function verifyV4RollbackReference({
  repository,
  token,
  expectedSha = V4_ROLLBACK_SHA,
  fetchImpl = globalThis.fetch,
} = {}) {
  const normalizedRepository = normalizeRepository(repository);
  const normalizedExpectedSha = normalizeExpectedSha(expectedSha);
  if (!String(token || '').trim()) {
    throw new Error('V4 rollback verification requires a GitHub read token.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('V4 rollback verification requires a fetch implementation.');
  }

  const response = await fetchImpl(rollbackRefUrl(normalizedRepository), {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${String(token).trim()}`,
      'x-github-api-version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 404) {
    throw new Error(`Required V4 rollback ref is missing: ${V4_ROLLBACK_BRANCH}`);
  }
  if (!response.ok) {
    throw new Error(`V4 rollback ref query failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const actualSha = String(payload?.object?.sha || '').toLowerCase();
  const objectType = String(payload?.object?.type || '');

  if (objectType !== 'commit') {
    throw new Error(`V4 rollback ref must point to a commit, got ${objectType || '<missing>'}.`);
  }
  if (!SHA_PATTERN.test(actualSha)) {
    throw new Error('V4 rollback ref returned an invalid commit SHA.');
  }
  if (actualSha !== normalizedExpectedSha) {
    throw new Error(
      `V4 rollback ref moved: expected ${normalizedExpectedSha}, got ${actualSha}. `
      + 'Rollback references are immutable release evidence and must not be repointed.',
    );
  }

  return Object.freeze({
    repository: normalizedRepository,
    branch: V4_ROLLBACK_BRANCH,
    sha: actualSha,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verifyV4RollbackReference({
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
  }).then(
    result => process.stdout.write(JSON.stringify(result, null, 2) + '\n'),
    error => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    },
  );
}
