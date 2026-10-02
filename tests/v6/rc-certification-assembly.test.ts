import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { assembleRcCertification } from '../../scripts/v6-assemble-rc-certification.mjs';
import { PREDEPLOY_REQUIRED_WORKFLOWS } from '../../scripts/v6-rc-exact-sha-gate.mjs';

const candidateSha = 'a'.repeat(40);
const artifactSha256 = 'b'.repeat(64);

function predeployEvidence(overrides = {}) {
  const workflows = PREDEPLOY_REQUIRED_WORKFLOWS.map((workflow, index) => ({
    workflow,
    runId: 1000 + index,
    url: `https://github.com/example/repo/actions/runs/${1000 + index}`,
    event: 'pull_request',
    completedAt: '2026-10-03T00:00:00Z',
  }));
  return {
    schemaVersion: 1,
    repository: 'example/repo',
    candidateSha,
    verifiedAt: '2026-10-03T00:01:00Z',
    requiredWorkflowCount: workflows.length,
    workflows,
    profile: 'predeploy',
    ...overrides,
  };
}

function deploymentEvidence(overrides = {}) {
  return {
    deploymentOrigin: 'https://abc123.mybiblequest.pages.dev',
    sourceSha: candidateSha,
    artifactSha256,
    integritySha256: 'c'.repeat(64),
    fileCount: 10,
    totalBytes: 12345,
    ...overrides,
  };
}

async function withEvidence(predeploy, deployment, fn) {
  const dir = await mkdtemp(join(tmpdir(), 'bq-rc-cert-'));
  try {
    const predeployPath = join(dir, 'predeploy.json');
    const deploymentPath = join(dir, 'deployment.json');
    await writeFile(predeployPath, JSON.stringify(predeploy), 'utf8');
    await writeFile(deploymentPath, JSON.stringify(deployment), 'utf8');
    return await fn({ predeployPath, deploymentPath });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('RC certification accepts the complete exact-SHA predeploy matrix', async () => {
  const certification = await withEvidence(
    predeployEvidence(),
    deploymentEvidence(),
    ({ predeployPath, deploymentPath }) => assembleRcCertification({
      repository: 'example/repo',
      candidateSha,
      predeployEvidencePath: predeployPath,
      deploymentEvidencePath: deploymentPath,
      certifyingRunId: '9000',
      now: () => new Date('2026-10-03T00:02:00Z'),
    }),
  );

  assert.equal(certification.candidateSha, candidateSha);
  assert.equal(certification.predeploy.requiredWorkflowCount, PREDEPLOY_REQUIRED_WORKFLOWS.length);
  assert.deepEqual(
    certification.predeploy.workflows.map(item => item.workflow),
    PREDEPLOY_REQUIRED_WORKFLOWS,
  );
});

test('RC certification rejects partial predeploy evidence even when candidate SHA matches', async () => {
  const partial = predeployEvidence();
  partial.workflows = partial.workflows.filter(
    item => item.workflow !== 'V6 Cloudflare Exact-SHA Preview Verification',
  );
  partial.requiredWorkflowCount = partial.workflows.length;

  await assert.rejects(
    withEvidence(
      partial,
      deploymentEvidence(),
      ({ predeployPath, deploymentPath }) => assembleRcCertification({
        repository: 'example/repo',
        candidateSha,
        predeployEvidencePath: predeployPath,
        deploymentEvidencePath: deploymentPath,
        certifyingRunId: '9001',
      }),
    ),
    /complete required workflow set|missing required workflow/i,
  );
});

test('RC certification rejects a non-predeploy evidence profile', async () => {
  await assert.rejects(
    withEvidence(
      predeployEvidence({ profile: 'full' }),
      deploymentEvidence(),
      ({ predeployPath, deploymentPath }) => assembleRcCertification({
        repository: 'example/repo',
        candidateSha,
        predeployEvidencePath: predeployPath,
        deploymentEvidencePath: deploymentPath,
        certifyingRunId: '9002',
      }),
    ),
    /predeploy profile/i,
  );
});

test('RC certification rejects deployment evidence bound to another SHA', async () => {
  await assert.rejects(
    withEvidence(
      predeployEvidence(),
      deploymentEvidence({ sourceSha: 'd'.repeat(40) }),
      ({ predeployPath, deploymentPath }) => assembleRcCertification({
        repository: 'example/repo',
        candidateSha,
        predeployEvidencePath: predeployPath,
        deploymentEvidencePath: deploymentPath,
        certifyingRunId: '9003',
      }),
    ),
    /Deployment evidence source SHA does not match/i,
  );
});
