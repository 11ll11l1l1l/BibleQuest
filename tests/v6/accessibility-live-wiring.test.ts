import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap = await readFile(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
const browserGate = await readFile(new URL('./built-artifact-browser.mjs', import.meta.url), 'utf8');

test('live bootstrap enables the V6 accessibility compatibility seam', () => {
  assert.match(bootstrap, /createFeatureCompatibilitySeam/);
  assert.match(bootstrap, /ACCESSIBILITY_PREFERENCES_FEATURE/);
  assert.match(bootstrap, /createAccessibilityPreferencesService/);
  assert.match(
    bootstrap,
    /createFeatureCompatibilitySeam\(\{\[ACCESSIBILITY_PREFERENCES_FEATURE\]:true\}\)/,
  );
  assert.match(bootstrap, /const legacyAccessibility=createAccessibilityService\(\{storage\}\)/);
  assert.match(
    bootstrap,
    /const accessibility=createAccessibilityPreferencesService\(legacyAccessibility,featureCompatibility\)/,
  );
  assert.doesNotMatch(bootstrap, /const accessibility=createAccessibilityService\(\{storage\}\)/);
});

test('built browser gate proves accessibility persistence across reload', () => {
  assert.match(browserGate, /V6 accessibility migration/);
  assert.match(browserGate, /biblequest\.v3\.accessibility-settings/);
  assert.match(browserGate, /savedAccessibility/);
  assert.match(browserGate, /accessibilityPage\.reload/);
});
