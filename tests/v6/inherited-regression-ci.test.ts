import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { workflowInvokesNode } from '../../scripts/v3-workflow-contract.mjs';

const workflow = fs.readFileSync(new URL('../../.github/workflows/v3-regression.yml', import.meta.url), 'utf8');
const inheritedStaticAction = fs.readFileSync(
  new URL('../../.github/actions/inherited-regression-static/action.yml', import.meta.url),
  'utf8',
);
const inheritedBrowserAction = fs.readFileSync(
  new URL('../../.github/actions/inherited-regression-browser/action.yml', import.meta.url),
  'utf8',
);

function inheritedMjsEntries(source: string): string[] {
  return [...new Set(source.match(/\b(?:scripts|tests)\/[A-Za-z0-9._/-]+\.mjs\b/g) ?? [])].sort();
}

function compatibilityIndexEntries(source: string, envName: string): string[] {
  const marker = envName + ': |';
  const start = source.indexOf(marker);
  if (start < 0) return [];
  const end = source.indexOf('\n        run: ":"', start);
  const block = end > start ? source.slice(start, end) : source.slice(start);
  return [...block.matchAll(/\bnode\s+((?:scripts|tests)\/[A-Za-z0-9._/-]+\.mjs)\b/g)]
    .map((match) => match[1])
    .sort();
}

test('inherited regression wrapper delegates static and browser execution through neutral seams', () => {
  assert.match(workflow, /^name: BibleQuest inherited regression$/m);
  assert.match(workflow, /group:\s*biblequest-inherited-/);
  assert.match(workflow, /uses:\s*\.\/\.github\/actions\/inherited-regression-static\b/);
  assert.match(workflow, /uses:\s*\.\/\.github\/actions\/inherited-regression-browser\b/);
  assert.equal(workflowInvokesNode(workflow, 'tests/v3-workflow-contract-edge.mjs'), true);
  assert.doesNotMatch(workflow, /\/tmp\/biblequest-v3-/);
  assert.doesNotMatch(workflow, /for test in tests\/v3-shell-smoke\.mjs/);
});

test('compatibility indexes mirror reusable action inventories for legacy validators', () => {
  const staticEntries = inheritedMjsEntries(inheritedStaticAction);
  const browserEntries = inheritedMjsEntries(inheritedBrowserAction);
  const staticCompatibility = compatibilityIndexEntries(workflow, 'BQ_INHERITED_STATIC_COMPATIBILITY_INDEX');
  const browserCompatibility = compatibilityIndexEntries(workflow, 'BQ_INHERITED_BROWSER_COMPATIBILITY_INDEX');

  assert.ok(staticEntries.length > 100, 'inherited static action inventory unexpectedly shrank');
  assert.ok(browserEntries.length > 50, 'inherited browser action inventory unexpectedly shrank');
  assert.deepEqual(staticCompatibility, staticEntries);
  assert.deepEqual(browserCompatibility, browserEntries);

  for (const entry of [...staticCompatibility, ...browserCompatibility]) {
    assert.equal(workflowInvokesNode(workflow, entry), true, 'legacy workflow contract cannot see ' + entry);
  }
});

test('version-neutral static action preserves representative V3, V4, and V5 cohorts', () => {
  assert.match(inheritedStaticAction, /^name: BibleQuest inherited static regression suite$/m);
  assert.match(inheritedStaticAction, /using:\s*composite/);
  assert.match(inheritedStaticAction, /run:\s*bash build\.sh/);
  for (const entry of [
    'scripts/validate-v3-architecture.mjs',
    'scripts/validate-v3-calendar.mjs',
    'tests/v4-assignment-self-only-edge.mjs',
    'tests/v5-leader-center-edge.mjs',
    'tests/v5-my-journey-static.mjs',
    'tests/v5-admin-reachability-edge.mjs',
    'tests/v5-1-localization-stabilization.mjs',
  ]) assert.equal(inheritedStaticAction.includes(entry), true, 'missing inherited static regression entry: ' + entry);
});

test('version-neutral browser action preserves legacy, V4 and V5 browser cohorts', () => {
  assert.match(inheritedBrowserAction, /^name: BibleQuest inherited browser regression suite$/m);
  assert.match(inheritedBrowserAction, /using:\s*composite/);
  assert.match(inheritedBrowserAction, /\/tmp\/biblequest-inherited-http\.log/);
  assert.doesNotMatch(inheritedBrowserAction, /\/tmp\/biblequest-v3-/);
  for (const entry of [
    'tests/v3-shell-smoke.mjs',
    'tests/v4-primary-family-smoke.mjs',
    'tests/v5-personal-challenges-browser.mjs',
    'tests/v5-leader-center-smoke.mjs',
    'tests/v5-1-localization-stabilization-browser.mjs',
  ]) assert.equal(inheritedBrowserAction.includes(entry), true, 'missing inherited browser regression entry: ' + entry);
});

test('legacy workflow validators retain coverage through compatibility metadata', () => {
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
    const source = fs.readFileSync(new URL('../../scripts/' + validator, import.meta.url), 'utf8');
    assert.match(source, /workflowInvokesNode/, validator + ': workflow contract missing');
    assert.doesNotMatch(source, /workflow\.includes\(/, validator + ': raw workflow token scan must not gate inherited coverage');
  }
});
