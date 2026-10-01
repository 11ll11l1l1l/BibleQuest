import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = '.github/workflows/v6-rc-exact-sha-gate.yml';

test('RC gate dispatches every exact-SHA component before collecting evidence', async () => {
  const workflow = await readFile(new URL('../../' + workflowPath, import.meta.url), 'utf8');

  assert.match(workflow, /deployment_url:\s*\n\s+description:/);
  assert.match(workflow, /actions:\s*write/);
  assert.match(workflow, /git\/ref\/heads\/v6\/architecture-upgrade/);
  assert.match(workflow, /test \"\$\{current_sha\}\" = \"\$\{BQ_RC_CANDIDATE_SHA\}\"/);

  const expectedDispatches = [
    ['v6-phase1-build.yml', 'candidate_sha'],
    ['v6-database-ci.yml', 'candidate_sha'],
    ['v6-client-artifact-security.yml', 'candidate_sha'],
    ['v6-dependency-security.yml', 'candidate_sha'],
    ['v6-v4-rollback-reference.yml', 'candidate_sha'],
    ['v3-regression.yml', 'candidate_sha'],
  ];
  for (const [file, input] of expectedDispatches) {
    assert.ok(workflow.includes(`gh workflow run ${file}`), `${file} must be dispatched`);
    assert.ok(workflow.includes(`-f ${input}=\"\${BQ_RC_CANDIDATE_SHA}\"`), `${file} must receive exact candidate SHA`);
  }

  assert.ok(workflow.includes('gh workflow run v6-deployment-verify.yml'));
  assert.ok(workflow.includes('-f expected_sha="${BQ_RC_CANDIDATE_SHA}"'));
  assert.ok(workflow.includes('-f deployment_url="${BQ_RC_DEPLOYMENT_URL}"'));
  assert.match(workflow, /gh run list --workflow/);
  assert.ok(workflow.includes('--event workflow_dispatch'));
  assert.ok(workflow.includes('.headSha == $sha and .createdAt >= $start'));

  const waitIndex = workflow.indexOf('- name: Wait for exact-SHA component gates');
  const collectIndex = workflow.indexOf('- name: Collect exact-SHA automated-gate evidence');
  assert.ok(waitIndex >= 0 && collectIndex > waitIndex, 'collector must run only after dispatched component gates complete');

  assert.ok(workflow.includes('v6-rc-exact-sha-dispatch.json'));
  assert.ok(workflow.includes('v6-rc-exact-sha-evidence.json'));
});
