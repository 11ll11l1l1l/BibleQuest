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
  if (report.usesVersionNeutralStaticAction) {
    assert.equal(report.directStaticValidators.length, 0);
    assert.ok(report.compatibilityStaticEntries.length >= 50);
  } else {
    assert.ok(report.directStaticValidators.length >= 50);
  }
  assert.ok(report.remainingLegacyCoupling.includes('workflow-display-name'));
  assert.ok(report.remainingLegacyCoupling.includes('concurrency-group'));
  assert.ok(report.remainingLegacyCoupling.includes('temporary-paths'));
  assert.ok(report.remainingLegacyCoupling.includes('inline-browser-cohort'));
  assert.equal(report.versionNeutral, false);
});

test('keeps compatibility metadata separate from executable static coverage after the planned extraction lands', () => {
  const current = readCurrentInheritedRegressionWorkflow();
  const withStaticAction = current.includes('./.github/actions/inherited-regression-static')
    ? current
    : current.replace(
      /      - name: Run accumulated architecture validators[\s\S]*?(?=      - name: Run accumulated edge regressions)/,
      [
        '      - name: Declare inherited static compatibility index',
        '        env:',
        '          BQ_INHERITED_STATIC_COMPATIBILITY_INDEX: |',
        '            node scripts/validate-v3-architecture.mjs',
        '        run: ":"',
        '      - name: Run inherited static regression suite',
        '        uses: ./.github/actions/inherited-regression-static',
        '',
      ].join('\n'),
    );
  const report = analyzeInheritedRegressionWorkflow(withStaticAction);

  assert.equal(report.usesVersionNeutralStaticAction, true);
  assert.equal(report.directStaticValidators.length, 0);
  assert.ok(report.compatibilityStaticEntries.length >= 1);
  assert.ok(report.remainingLegacyCoupling.includes('compatibility-static-index'));
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
  assert.deepEqual(report.compatibilityStaticEntries, []);
  assert.deepEqual(report.directBrowserTests, []);
  assert.deepEqual(report.legacyTempPaths, []);
  assert.deepEqual(report.remainingLegacyCoupling, []);
  assert.equal(report.versionNeutral, true);
});
