import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { workflowInvokesNode } from '../../scripts/v3-workflow-contract.mjs';

const workflow = fs.readFileSync(new URL('../../.github/workflows/v3-regression.yml', import.meta.url), 'utf8');
const inheritedAction = fs.readFileSync(
  new URL('../../.github/actions/inherited-regression-static/action.yml', import.meta.url),
  'utf8',
);

test('legacy regression check identity is preserved while static execution moves behind a neutral seam', () => {
  assert.match(workflow, /^name: BibleQuest v3 regression$/m);
  assert.match(workflow, /uses:\s*\.\/\.github\/actions\/inherited-regression-static\b/);
  assert.doesNotMatch(workflow, /scripts\/validate-v3-architecture\.mjs/);
  assert.doesNotMatch(workflow, /tests\/v5-admin-reachability-edge\.mjs/);
});

test('version-neutral inherited action preserves representative V3, V4, and V5 regression cohorts', () => {
  assert.match(inheritedAction, /^name: BibleQuest inherited static regression suite$/m);
  assert.match(inheritedAction, /using:\s*composite/);
  assert.match(inheritedAction, /run:\s*bash build\.sh/);

  for (const entry of [
    'scripts/validate-v3-architecture.mjs',
    'scripts/validate-v3-calendar.mjs',
    'tests/v3-workflow-contract-edge.mjs',
    'tests/v4-assignment-self-only-edge.mjs',
    'tests/v5-leader-center-edge.mjs',
    'tests/v5-my-journey-static.mjs',
    'tests/v5-admin-reachability-edge.mjs',
    'tests/v5-1-localization-stabilization.mjs',
  ]) {
    assert.equal(workflowInvokesNode(inheritedAction, entry), true, `missing inherited regression entry: ${entry}`);
  }

  assert.match(inheritedAction, /node --check tests\/v3-field-validation-harness\.mjs/);
  assert.match(inheritedAction, /node --check tests\/v3-field-linked-assignment-harness\.mjs/);
  assert.match(inheritedAction, /node --check tests\/v3-field-live-room-harness\.mjs/);
});
