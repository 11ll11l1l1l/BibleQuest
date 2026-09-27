import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeInheritedRegressionWorkflow,
  readCurrentInheritedRegressionWorkflow,
} from '../../scripts/v6-ci-legacy-coupling.mjs';

test('current inherited regression wrapper is version-neutral while retaining V6 coverage', () => {
  const report = analyzeInheritedRegressionWorkflow(readCurrentInheritedRegressionWorkflow());

  assert.equal(report.targetsV6, true);
  assert.equal(report.legacyWorkflowName, false);
  assert.equal(report.legacyConcurrencyGroup, false);
  assert.deepEqual(report.legacyTempPaths, []);
  assert.equal(report.usesVersionNeutralStaticAction, true);
  assert.equal(report.usesVersionNeutralBrowserAction, true);
  assert.deepEqual(report.directStaticValidators, []);
  assert.deepEqual(report.directBrowserTests, []);
  assert.ok(report.compatibilityStaticEntries.length >= 50);
  assert.deepEqual(report.remainingLegacyCoupling, []);
  assert.equal(report.versionNeutral, true);
});

test('compatibility metadata does not count as executable workflow coupling', () => {
  const source = [
    'name: BibleQuest inherited regression',
    'on:',
    '  pull_request:',
    '    branches:',
    '      - v6/architecture-upgrade',
    'jobs:',
    '  regression:',
    '    steps:',
    '      - name: Declare inherited static compatibility index',
    '        env:',
    '          BQ_INHERITED_STATIC_COMPATIBILITY_INDEX: |',
    '            node scripts/validate-v3-architecture.mjs',
    '        run: ":"',
    '      - uses: ./.github/actions/inherited-regression-static',
    '      - uses: ./.github/actions/inherited-regression-browser',
    '',
  ].join('\n');

  const report = analyzeInheritedRegressionWorkflow(source);
  assert.equal(report.compatibilityStaticEntries.length, 1);
  assert.deepEqual(report.remainingLegacyCoupling, []);
  assert.equal(report.versionNeutral, true);
});

test('legacy names, temp paths, or inline browser cohorts remain detectable', () => {
  const source = [
    'name: BibleQuest v3 regression',
    'on:',
    '  pull_request:',
    '    branches:',
    '      - v6/architecture-upgrade',
    'concurrency:',
    '  group: biblequest-v3-${{ github.ref }}',
    'jobs:',
    '  regression:',
    '    steps:',
    '      - uses: ./.github/actions/inherited-regression-static',
    '      - name: Run accumulated browser/mobile regressions',
    '        run: node tests/v3-shell-smoke.mjs > /tmp/biblequest-v3-http.log',
    '',
  ].join('\n');

  const report = analyzeInheritedRegressionWorkflow(source);
  assert.equal(report.legacyWorkflowName, true);
  assert.equal(report.legacyConcurrencyGroup, true);
  assert.ok(report.legacyTempPaths.length >= 1);
  assert.ok(report.directBrowserTests.length >= 1);
  assert.ok(report.remainingLegacyCoupling.includes('workflow-display-name'));
  assert.ok(report.remainingLegacyCoupling.includes('concurrency-group'));
  assert.ok(report.remainingLegacyCoupling.includes('temporary-paths'));
  assert.ok(report.remainingLegacyCoupling.includes('inline-browser-cohort'));
  assert.equal(report.versionNeutral, false);
});
