import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync('scripts/v6-build-evidence.mjs', 'utf8');

test('build evidence defines deterministic startup and lazy-route performance budgets', () => {
  for (const token of [
    'initialJavaScriptBytes:',
    'initialStylesheetBytes:',
    'featureRouteJavaScriptBytes:',
    'featureRouteStylesheetBytes:',
    'collectStaticManifestResources',
    'startupPerformance',
    'featureRoutePerformance',
    'largestFeatureRouteJavaScript',
    'largestFeatureRouteStylesheet',
    'initial JS',
    'initial CSS',
    'feature route JS',
    'feature route CSS',
  ]) {
    assert.ok(source.includes(token), `missing critical-route performance contract: ${token}`);
  }
});

test('startup accounting follows only static manifest imports', () => {
  assert.match(source, /for \(const imported of chunk\.imports \|\| \[\]\) visit\(imported\)/);
  assert.doesNotMatch(source, /for \(const imported of chunk\.dynamicImports/);
  assert.match(source, /const startupResources = collectStaticManifestResources\(browserEntrySource\)/);
});

test('lazy feature budgets count only incremental resources beyond startup', () => {
  assert.match(
    source,
    /resources\.javascript\.filter\(\(path\) => !startupJavascriptSet\.has\(path\)\)/,
  );
  assert.match(
    source,
    /resources\.stylesheets\.filter\(\(path\) => !startupStylesheetSet\.has\(path\)\)/,
  );
  assert.match(source, /if \(route\.javascriptBytes > budgets\.featureRouteJavaScriptBytes\)/);
  assert.match(source, /if \(route\.stylesheetBytes > budgets\.featureRouteStylesheetBytes\)/);
});

test('performance budget thresholds retain bounded headroom rather than disabling the gate', () => {
  assert.match(source, /initialJavaScriptBytes: 1250 \* 1024/);
  assert.match(source, /initialStylesheetBytes: 1024 \* 1024/);
  assert.match(source, /featureRouteJavaScriptBytes: 600 \* 1024/);
  assert.match(source, /featureRouteStylesheetBytes: 512 \* 1024/);
});
