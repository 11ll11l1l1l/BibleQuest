import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { assembleRcCertification } from '../../scripts/v6-assemble-rc-certification.mjs';
import {
  DEFAULT_REQUIRED_WORKFLOWS,
  PREDEPLOY_REQUIRED_WORKFLOWS,
} from '../../scripts/v6-rc-exact-sha-gate.mjs';

const candidateSha = 'a'.repeat(40);
const artifactSha = 'b'.repeat(64);
const marker = 'docs/v6/RC_CANDIDATE.json';

test('RC marker fans out every path-filtered exact-SHA component gate', async () => {
  const workflowPaths = [
    '../../.github/workflows/v6-phase1-build.yml',
    '../../.github/workflows/v6-database-ci.yml',
    '../../.github/workflows/v6-client-artifact-security.yml',
    '../../.github/workflows/v6-dependency-security.yml',
    '../../.github/workflows/v6-v4-rollback-reference.yml',
  ];
  for (const path of workflowPaths) {
    const workflow = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.ok(workflow.includes(marker), `${path} must react to the RC marker`);
  }

  const inherited = await readFile(new URL('../../.github/workflows/v3-regression.yml', import.meta.url), 'utf8');
  assert.match(inherited, /pull_request:[\s\S]*v6\/architecture-upgrade/);
});

test('pre-deployment evidence is the six non-deployment gates and full evidence adds Cloudflare verification', () => {
  assert.deepEqual(PREDEPLOY_REQUIRED_WORKFLOWS, [
    'V6 Phase 1 Build Gate',
    'V6 Database CI',
    'V6 Client Artifact Security',
    'V6 Dependency Security',
    'V6 V4 Rollback Reference Guard',
    'BibleQuest inherited regression',
  ]);
  assert.equal(DEFAULT_REQUIRED_WORKFLOWS.length, 7);
  assert.ok(DEFAULT_REQUIRED_WORKFLOWS.includes('V6 Deployed Artifact Verification'));
});

test('Cloudflare verifier binds an RC PR preview and emits durable certification evidence', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/v6-deployment-verify.yml', import.meta.url), 'utf8');
  for (const token of [
    'pull_request:',
    marker,
    'cloudflare-workers-and-pages[bot]',
    "BQ_RC_EVIDENCE_PROFILE: predeploy",
    "BQ_RC_WAIT_MS: '4200000'",
    'v6-rc-certification.json',
    'actions/upload-artifact@v4',
  ]) {
    assert.ok(workflow.includes(token), `deployment verification workflow missing: ${token}`);
  }
});

test('aggregate RC collector waits for the Cloudflare verifier on the same RC PR head', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/v6-rc-exact-sha-gate.yml', import.meta.url), 'utf8');
  for (const token of [
    'pull_request:',
    marker,
    'github.event.pull_request.head.sha',
    "BQ_RC_WAIT_MS: '4500000'",
  ]) {
    assert.ok(workflow.includes(token), `RC aggregate workflow missing: ${token}`);
  }
});

test('RC certification rejects cross-SHA evidence and preserves deployed artifact identity', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bq-v6-rc-'));
  try {
    const predeployPath = join(directory, 'predeploy.json');
    const deploymentPath = join(directory, 'deployment.json');
    const outputPath = join(directory, 'certification.json');
    await writeFile(predeployPath, JSON.stringify({
      candidateSha,
      requiredWorkflowCount: PREDEPLOY_REQUIRED_WORKFLOWS.length,
      workflows: [],
    }), 'utf8');
    await writeFile(deploymentPath, JSON.stringify({
      sourceSha: candidateSha,
      artifactSha256: artifactSha,
      deploymentOrigin: 'https://candidate.mybiblequest.pages.dev',
      fileCount: 10,
      totalBytes: 100,
    }), 'utf8');

    const certification = await assembleRcCertification({
      repository: 'example/repo',
      candidateSha,
      predeployEvidencePath: predeployPath,
      deploymentEvidencePath: deploymentPath,
      certifyingRunId: '123',
      outputPath,
      now: () => new Date('2026-10-02T00:00:00Z'),
    });

    assert.equal(certification.candidateSha, candidateSha);
    assert.equal(certification.artifactSha256, artifactSha);
    assert.equal(certification.deploymentOrigin, 'https://candidate.mybiblequest.pages.dev');
    assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).certifyingRunId, '123');

    await assert.rejects(
      assembleRcCertification({
        repository: 'example/repo',
        candidateSha: 'c'.repeat(40),
        predeployEvidencePath: predeployPath,
        deploymentEvidencePath: deploymentPath,
      }),
      /Pre-deployment evidence candidate SHA does not match/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
