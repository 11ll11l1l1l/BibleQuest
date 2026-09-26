import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { workflowInvokesNode } from '../../scripts/v3-workflow-contract.mjs';

const workflow = fs.readFileSync(new URL('../../.github/workflows/v3-regression.yml', import.meta.url), 'utf8');
const inheritedAction = fs.readFileSync(
  new URL('../../.github/actions/inherited-regression-static/action.yml', import.meta.url),
  'utf8',
);

function inheritedMjsEntries(source: string): string[] {
  return [...new Set(source.match(/\b(?:scripts|tests)\/[A-Za-z0-9._/-]+\.mjs\b/g) ?? [])].sort();
}

function compatibilityIndexEntries(source: string): string[] {
  const block =
    source.match(/BQ_INHERITED_STATIC_COMPATIBILITY_INDEX:\s*\|\n([\s\S]*?)\n\s*run:\s*\":\"/)?.[1] ?? '';
  return [...block.matchAll(/\bnode\s+((?:scripts|tests)\/[A-Za-z0-9._/-]+\.mjs)\b/g)]
    .map((match) => match[1])
    .sort();
}

test('legacy regression check identity is preserved while static execution moves behind a neutral seam', () => {
  assert.match(workflow, /^name: BibleQuest v3 regression$/m);
  assert.match(workflow, /uses:\s*\.\/\.github\/actions\/inherited-regression-static\b/);
  assert.equal(workflowInvokesNode(workflow, 'tests/v3-workflow-contract-edge.mjs'), true);
  assert.doesNotMatch(workflow, /for script in scripts\/validate-v3-architecture\.mjs/);
  assert.doesNotMatch(workflow, /for test in tests\/v4-assignment-self-only-edge\.mjs/);
});

test('compatibility index mirrors every static action entry for legacy wrapper introspection', () => {
  const actionEntries = inheritedMjsEntries(inheritedAction);
  const compatibilityEntries = compatibilityIndexEntries(workflow);

  assert.ok(actionEntries.length > 100, 'inherited static action inventory unexpectedly shrank');
  assert.deepEqual(compatibilityEntries, actionEntries);

  for (const entry of compatibilityEntries) {
    assert.equal(workflowInvokesNode(workflow, entry), true, `legacy workflow contract cannot see ${entry}`);
  }
});

test('version-neutral inherited action preserves representative V3, V4, and V5 regression cohorts', () => {
  assert.match(inheritedAction, /^name: BibleQuest inherited static regression suite$/m);
  assert.match(inheritedAction, /using:\s*composite/);
  assert.match(inheritedAction, /run:\s*bash build\.sh/);

  for (const entry of [
    'scripts/validate-v3-architecture.mjs',
    'scripts/validate-v3-calendar.mjs',
    'tests/v4-assignment-self-only-edge.mjs',
    'tests/v5-leader-center-edge.mjs',
    'tests/v5-my-journey-static.mjs',
    'tests/v5-admin-reachability-edge.mjs',
    'tests/v5-1-localization-stabilization.mjs',
  ]) {
    assert.equal(inheritedAction.includes(entry), true, `missing inherited regression entry: ${entry}`);
  }

  assert.match(inheritedAction, /node --check tests\/v3-field-validation-harness\.mjs/);
  assert.match(inheritedAction, /node --check tests\/v3-field-linked-assignment-harness\.mjs/);
  assert.match(inheritedAction, /node --check tests\/v3-field-live-room-harness\.mjs/);
});


test('legacy workflow validators resolve inherited coverage through the composite-aware contract', () => {
  const validators = [
    'validate-v3-admin-operations.mjs',
    'validate-v3-advanced-assignments.mjs',
    'validate-v3-assignment-push.mjs',
    'validate-v3-assignments.mjs',
    'validate-v3-bible-world-artwork.mjs',
    'validate-v3-bible-world.mjs',
    'validate-v3-leaderboards.mjs',
    'validate-v3-live-rooms.mjs',
    'validate-v3-same-room-play-together.mjs',
  ];

  for (const validator of validators) {
    const source = fs.readFileSync(new URL(`../../scripts/${validator}`, import.meta.url), 'utf8');
    assert.match(source, /workflowInvokesNode/,`${validator}: composite-aware workflow contract missing`);
    assert.doesNotMatch(source, /workflow\.includes\(/,`${validator}: raw outer-workflow token scan must not gate inherited coverage`);
  }
});
