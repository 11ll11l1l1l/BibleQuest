import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  RC_MARKER_INTENT,
  buildRcCandidateMarker,
  normalizeRcBaseSha,
  readAndValidateRcCandidateMarker,
  serializeRcCandidateMarker,
  validateRcCandidateMarker,
  writeRcCandidateMarker,
} from '../../scripts/v6-rc-candidate-marker.mjs';

const baseSha = 'a'.repeat(40);

test('RC marker is deterministic and intentionally does not self-reference its own commit SHA', () => {
  const marker = buildRcCandidateMarker(baseSha);
  assert.deepEqual(marker, {
    schemaVersion: 1,
    intent: RC_MARKER_INTENT,
    baseIntegrationSha: baseSha,
    candidateIdentity: 'commit-containing-this-marker',
    automatedGateProfile: 'full',
  });
  assert.equal(JSON.stringify(marker).includes('candidateSha'), false);
});

test('RC marker validates only against the exact integration base SHA', () => {
  const marker = buildRcCandidateMarker(baseSha);
  assert.equal(validateRcCandidateMarker(marker, baseSha).baseIntegrationSha, baseSha);
  assert.throws(
    () => validateRcCandidateMarker(marker, 'b'.repeat(40)),
    /marker base mismatch/i,
  );
  assert.throws(() => normalizeRcBaseSha('abc1234'), /exact 40-character/i);
});

test('RC marker refuses weakened, ambiguous, or extended schemas', () => {
  const marker = buildRcCandidateMarker(baseSha);
  assert.throws(
    () => validateRcCandidateMarker({ ...marker, automatedGateProfile: 'predeploy' }, baseSha),
    /full automated gate profile/i,
  );
  assert.throws(
    () => validateRcCandidateMarker({ ...marker, candidateIdentity: 'branch-head' }, baseSha),
    /commit containing the marker/i,
  );
  assert.throws(
    () => validateRcCandidateMarker({ ...marker, candidateSha: 'b'.repeat(40) }, baseSha),
    /fields must exactly match/i,
  );
});

test('RC marker writer produces and validator requires canonical JSON', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bq-v6-rc-marker-'));
  try {
    const output = join(dir, 'RC_CANDIDATE.json');
    await writeRcCandidateMarker({ baseIntegrationSha: baseSha, outputPath: output });
    const input = await readFile(output, 'utf8');
    const parsed = JSON.parse(input);
    assert.deepEqual(parsed, buildRcCandidateMarker(baseSha));
    assert.equal(input, serializeRcCandidateMarker(buildRcCandidateMarker(baseSha)));
    assert.deepEqual(
      await readAndValidateRcCandidateMarker({ markerPath: output, expectedBaseSha: baseSha }),
      buildRcCandidateMarker(baseSha),
    );

    await writeFile(output, JSON.stringify(parsed) + '\n', 'utf8');
    await assert.rejects(
      readAndValidateRcCandidateMarker({ markerPath: output, expectedBaseSha: baseSha }),
      /canonical generated JSON encoding/i,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const markerTriggeredWorkflows = [
  '.github/workflows/v6-phase1-build.yml',
  '.github/workflows/v6-database-ci.yml',
  '.github/workflows/v6-client-artifact-security.yml',
  '.github/workflows/v6-dependency-security.yml',
  '.github/workflows/v6-v4-rollback-reference.yml',
  '.github/workflows/v6-deployment-verify.yml',
  '.github/workflows/v6-rc-exact-sha-gate.yml',
];

test('RC marker fans out every candidate-specific automated gate on the same PR head', () => {
  for (const path of markerTriggeredWorkflows) {
    const workflow = readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
    const pullRequestBlock = workflow.match(/pull_request:[\s\S]*?(?=\n  (?:workflow_dispatch|push|schedule):)/)?.[0] || '';
    assert.match(
      pullRequestBlock,
      /docs\/v6\/RC_CANDIDATE\.json/,
      `${path} must trigger its pull_request gate when the canonical RC marker is created`,
    );
  }

  const inherited = readFileSync(
    new URL('../../.github/workflows/v3-regression.yml', import.meta.url),
    'utf8',
  );
  const inheritedPullRequest = inherited.match(/pull_request:[\s\S]*?(?=\n\nconcurrency:)/)?.[0] || '';
  assert.match(inheritedPullRequest, /- v6\/architecture-upgrade/);
  assert.doesNotMatch(inheritedPullRequest, /\n\s+paths:/);
});

test('all exact-SHA predeploy gates keep candidate_sha workflow-dispatch support', () => {
  const dispatchable = [
    '.github/workflows/v6-phase1-build.yml',
    '.github/workflows/v6-database-ci.yml',
    '.github/workflows/v6-client-artifact-security.yml',
    '.github/workflows/v6-dependency-security.yml',
    '.github/workflows/v6-v4-rollback-reference.yml',
    '.github/workflows/v3-regression.yml',
  ];
  for (const path of dispatchable) {
    const workflow = readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
    assert.match(workflow, /workflow_dispatch:[\s\S]*?candidate_sha:/, `${path} lost candidate_sha dispatch`);
    assert.match(workflow, /ref:\s*\$\{\{[^\n]*(?:candidate_sha|BQ_EXACT_SHA)/, `${path} does not checkout the selected candidate`);
  }
});

test('RC workflow enforces the same one-commit marker contract for PR and manual recertification', () => {
  const workflow = readFileSync(
    new URL('../../.github/workflows/v6-rc-exact-sha-gate.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /Require one-commit marker-only exact-base RC candidate/);
  assert.doesNotMatch(workflow, /if:\s*github\.event_name == 'pull_request'/);
  assert.match(workflow, /git rev-list --parents -n 1/);
  assert.match(workflow, /test "\$\{#commit_and_parents\[@\]\}" -eq 2/);
  assert.match(workflow, /github\.event\.pull_request\.base\.sha/);
  assert.match(workflow, /test "\$\{parent_sha\}" = "\$\{BQ_RC_PR_BASE_SHA,,\}"/);
  assert.match(workflow, /v6-rc-candidate-marker\.mjs --validate docs\/v6\/RC_CANDIDATE\.json "\$\{parent_sha\}"/);
  assert.match(workflow, /git diff --name-only "\$\{parent_sha\}" "\$\{BQ_RC_CANDIDATE_SHA\}"/);
  assert.match(workflow, /test "\$\{changed\[0\]\}" = "docs\/v6\/RC_CANDIDATE\.json"/);
});
