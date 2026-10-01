import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const MAX_PAGES = 10;
const PER_PAGE = 100;

export const PREDEPLOY_REQUIRED_WORKFLOWS = Object.freeze([
  'V6 Phase 1 Build Gate',
  'V6 Database CI',
  'V6 Client Artifact Security',
  'V6 Dependency Security',
  'V6 V4 Rollback Reference Guard',
  'BibleQuest inherited regression',
]);

export const DEFAULT_REQUIRED_WORKFLOWS = Object.freeze([
  ...PREDEPLOY_REQUIRED_WORKFLOWS,
  'V6 Deployed Artifact Verification',
]);

export function normalizeCandidateSha(value) {
  const sha = String(value || '').trim().toLowerCase();
  if (!SHA_PATTERN.test(sha)) {
    throw new Error('V6 RC evidence requires an exact 40-character candidate SHA.');
  }
  return sha;
}

export function normalizeRepository(value) {
  const repository = String(value || '').trim();
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new Error('V6 RC evidence requires GITHUB_REPOSITORY in owner/name form.');
  }
  return repository;
}

function normalizeRequiredWorkflows(value = DEFAULT_REQUIRED_WORKFLOWS) {
  if (!Array.isArray(value) || value.length < 1) {
    throw new Error('V6 RC evidence requires at least one automated workflow.');
  }
  const names = value.map(name => String(name || '').trim());
  if (names.some(name => !name)) {
    throw new Error('V6 RC evidence workflow names must be non-empty.');
  }
  if (new Set(names).size !== names.length) {
    throw new Error('V6 RC evidence workflow names must be unique.');
  }
  return names;
}

async function fetchWorkflowRuns({ repository, candidateSha, token, fetchImpl }) {
  const runs = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(`https://api.github.com/repos/${repository}/actions/runs`);
    url.searchParams.set('head_sha', candidateSha);
    url.searchParams.set('per_page', String(PER_PAGE));
    url.searchParams.set('page', String(page));

    const response = await fetchImpl(url, {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error(`GitHub Actions evidence query failed: HTTP ${response.status}`);
    }
    const payload = await response.json();
    const pageRuns = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
    runs.push(...pageRuns);
    if (pageRuns.length < PER_PAGE) break;
    if (page === MAX_PAGES) {
      throw new Error(`GitHub Actions evidence exceeds ${MAX_PAGES * PER_PAGE} runs for candidate ${candidateSha}.`);
    }
  }
  return runs;
}

function pickSuccessfulRun(runs, workflowName, candidateSha) {
  const exact = runs
    .filter(run =>
      run?.name === workflowName
      && String(run?.head_sha || '').toLowerCase() === candidateSha
      && run?.status === 'completed'
      && run?.conclusion === 'success'
    )
    .sort((a, b) => String(b?.updated_at || '').localeCompare(String(a?.updated_at || '')));
  return exact[0] || null;
}

export async function collectExactShaRcEvidence({
  repository,
  candidateSha,
  token,
  requiredWorkflows = DEFAULT_REQUIRED_WORKFLOWS,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
} = {}) {
  const normalizedRepository = normalizeRepository(repository);
  const normalizedSha = normalizeCandidateSha(candidateSha);
  const names = normalizeRequiredWorkflows(requiredWorkflows);
  if (!String(token || '').trim()) throw new Error('V6 RC evidence requires a GitHub Actions read token.');
  if (typeof fetchImpl !== 'function') throw new Error('V6 RC evidence requires a fetch implementation.');

  const runs = await fetchWorkflowRuns({
    repository: normalizedRepository,
    candidateSha: normalizedSha,
    token: String(token).trim(),
    fetchImpl,
  });

  const evidence = [];
  const missing = [];
  for (const name of names) {
    const run = pickSuccessfulRun(runs, name, normalizedSha);
    if (!run) {
      missing.push(name);
      continue;
    }
    evidence.push(Object.freeze({
      workflow: name,
      runId: Number(run.id),
      url: String(run.html_url || ''),
      event: String(run.event || ''),
      completedAt: String(run.updated_at || ''),
    }));
  }

  if (missing.length) {
    throw new Error(
      `Candidate ${normalizedSha} is not RC-automated-gate ready. Missing exact-SHA SUCCESS: ${missing.join(', ')}`,
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    repository: normalizedRepository,
    candidateSha: normalizedSha,
    verifiedAt: now().toISOString(),
    requiredWorkflowCount: names.length,
    workflows: evidence,
  });
}

export async function waitForExactShaRcEvidence({
  timeoutMs = 0,
  pollIntervalMs = 15000,
  sleepImpl = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms)),
  ...options
} = {}) {
  const timeout = Number(timeoutMs);
  const interval = Number(pollIntervalMs);
  if (!Number.isFinite(timeout) || timeout < 0) throw new Error('RC evidence wait timeout must be a non-negative number.');
  if (!Number.isFinite(interval) || interval < 0) throw new Error('RC evidence poll interval must be a non-negative number.');

  const startedAt = Date.now();
  let lastMissingError;
  while (true) {
    try {
      return await collectExactShaRcEvidence(options);
    } catch (error) {
      const message = String(error?.message || error);
      const retryable = message.includes('is not RC-automated-gate ready. Missing exact-SHA SUCCESS:');
      if (!retryable) throw error;
      lastMissingError = error;
      if (timeout === 0 || Date.now() - startedAt >= timeout) throw error;
      await sleepImpl(interval);
    }
  }
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  const profile = String(process.env.BQ_RC_EVIDENCE_PROFILE || 'full').trim().toLowerCase();
  const requiredWorkflows = profile === 'predeploy'
    ? PREDEPLOY_REQUIRED_WORKFLOWS
    : DEFAULT_REQUIRED_WORKFLOWS;
  const timeoutMs = Number(process.env.BQ_RC_WAIT_MS || 0);
  const pollIntervalMs = Number(process.env.BQ_RC_POLL_MS || 15000);

  waitForExactShaRcEvidence({
    repository: process.env.GITHUB_REPOSITORY,
    candidateSha: process.env.BQ_RC_CANDIDATE_SHA,
    token: process.env.GITHUB_TOKEN,
    requiredWorkflows,
    timeoutMs,
    pollIntervalMs,
  }).then(
    async evidence => {
      const json = JSON.stringify({ ...evidence, profile }, null, 2) + '\n';
      const output = process.env.BQ_RC_EVIDENCE_OUTPUT;
      if (output) await writeFile(output, json, 'utf8');
      process.stdout.write(json);
    },
    error => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    },
  );
}
