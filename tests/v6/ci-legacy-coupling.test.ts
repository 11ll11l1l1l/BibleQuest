import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeInheritedRegressionWorkflow,
  readCurrentInheritedRegressionWorkflow,
} from '../../scripts/v6-ci-legacy-coupling.mjs';

test('characterizes the remaining version-coupled inherited CI wrapper without claiming checklist completion', () => {
  const report = analyzeInheritedRegressionWorkflow(readCurrentInheritedRegressionWorkflow());

  assert.equal(report.targetsV6, true);
  assert.equal(report.legacyWorkflowName, true);
  assert.equal(report.legacyConcurrencyGroup, true);
  assert.ok(report.legacyTempPaths.length >= 1);
  assert.ok(report.directBrowserTests.length >= 50);
  assert.ok(
    report.directStaticValidators.length > 0 || report.usesVersionNeutralStaticAction,
    'static inherited regressions must remain either explicit or delegated to the version-neutral action',
  );
  assert.ok(report.remainingLegacyCoupling.includes('workflow-display-name'));
  assert.ok(report.remainingLegacyCoupling.includes('concurrency-group'));
  assert.ok(report.remainingLegacyCoupling.includes('temporary-paths'));
  assert.ok(report.remainingLegacyCoupling.includes('inline-browser-cohort'));
  assert.equal(report.versionNeutral, false);
});

test('keeps browser naming debt visible after the planned static-cohort extraction lands', () => {
  const current = readCurrentInheritedRegressionWorkflow();
  const withStaticAction = current.replace(
    /      - name: Run accumulated architecture validators[\s\S]*?(?=      - name: Run accumulated edge regressions)/,
    '      - uses: ./.github/actions/inherited-regression-static\n',
  );
  const report = analyzeInheritedRegressionWorkflow(withStaticAction);

  assert.equal(report.usesVersionNeutralStaticAction, true);
  assert.equal(report.directStaticValidators.length, 0);
  assert.ok(report.directBrowserTests.length >= 50);
  assert.ok(report.remainingLegacyCoupling.includes('inline-browser-cohort'));
  assert.equal(report.versionNeutral, false);
});

test('recognizes a future wrapper that delegates inherited cohorts without legacy v3/v4 workflow identity', () => {
  const futureWrapper = [
    'name: BibleQuest inherited regression',
    '',
    'on:',
    '  pull_request:',
    '    branches:',
    '      - v6/architecture-upgrade',
    '',
    'concurrency:',
    '  group: biblequest-inherited-${{ github.ref }}',
    '  cancel-in-progress: true',
    '',
    'jobs:',
    '  regression:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: ./.github/actions/inherited-regression-static',
    '      - uses: ./.github/actions/inherited-regression-browser',
    '',
  ].join('\n');

  const report = analyzeInheritedRegressionWorkflow(futureWrapper);

  assert.equal(report.targetsV6, true);
  assert.equal(report.usesVersionNeutralStaticAction, true);
  assert.equal(report.usesVersionNeutralBrowserAction, true);
  assert.deepEqual(report.directStaticValidators, []);
  assert.deepEqual(report.directBrowserTests, []);
  assert.deepEqual(report.legacyTempPaths, []);
  assert.deepEqual(report.remainingLegacyCoupling, []);
  assert.equal(report.versionNeutral, true);
});
