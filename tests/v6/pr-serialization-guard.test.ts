import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

test('V6 serialization guard revalidates PR heads against the live integration ref', () => {
  const workflow = read('.github/workflows/v6-pr-serialization-guard.yml');

  assert.match(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.equal(workflow.includes('types: [opened, reopened, synchronize, ready_for_review, edited]'), true);
  assert.match(workflow, /git\/ref\/heads\/\$BASE_REF/);
  assert.match(workflow, /git\/ref\/heads\/v6\/architecture-upgrade/);
  assert.doesNotMatch(workflow, /BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);

  const statusWrites = workflow.match(/context="V6 Serialization"/g) || [];
  assert.equal(statusWrites.length, 2);
  assert.match(workflow, /statuses\/\$HEAD_SHA/);
  assert.match(workflow, /statuses\/\$head_sha/);
  assert.match(workflow, /state=success/);
  assert.match(workflow, /state=failure/);
  assert.match(workflow, /if \[ "\$state" != "success" \]; then/);
});

test('serialization policy requires exact refreshed-head evidence', () => {
  const policy = read('docs/v6-development-serialization-policy.md');

  assert.match(policy, /resolves the live integration ref rather than trusting an event-snapshot base SHA/);
  assert.match(policy, /refreshed head must receive a new green `V6 Serialization` status/);
  assert.match(policy, /`V6 Serialization` is green on the exact current PR head/);
  assert.match(policy, /required V6 Phase 1 \/ database \/ security \/ inherited regression gates are green for that exact head/);
});
