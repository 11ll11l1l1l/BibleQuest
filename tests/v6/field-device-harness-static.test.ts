import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, js, index, bootstrap, vite] = await Promise.all([
  readFile(new URL('../../v6-field-device.html', import.meta.url), 'utf8'),
  readFile(new URL('../../v6-field-device.js', import.meta.url), 'utf8'),
  readFile(new URL('../../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8'),
  readFile(new URL('../../vite.config.mjs', import.meta.url), 'utf8'),
]);

test('V6 physical PWA/accessibility field harness stays unlinked, exact-SHA-bound and non-privileged', () => {
  assert.match(html, /QA ONLY — V6 PHYSICAL DEVICE HARNESS/);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /v6-field-device\.js/);
  assert.match(html, /Installed-PWA offline behavior/);
  assert.match(html, /Manual accessibility: screen reader/);
  assert.match(html, /Manual accessibility: reduced motion\/contrast/);

  assert.equal(index.includes('v6-field-device'), false, 'field harness must remain outside the product navigation');
  assert.equal(bootstrap.includes('v6-field-device'), false, 'field harness must remain outside normal bootstrap');

  for (const forbidden of [
    'sb_secret_',
    'service_role',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VAPID_PRIVATE',
    'password',
    'push endpoint',
  ]) {
    assert.equal(js.includes(forbidden), false, 'field harness must not contain privileged or credential material: ' + forbidden);
  }

  assert.match(js, /fetch\('\.\/bq-build\.json'/);
  assert.match(js, /\^\[0-9a-f\]\{40\}\$/i);
  assert.match(js, /bq:v6:physical-field:/);
  assert.match(js, /evidenceClass: 'PHYSICAL-DEVICE'/);
  assert.match(js, /physicalInstalledPwaOffline/);
  assert.match(js, /criticalManualAccessibility/);
  assert.match(js, /PASS requires every physical sub-check/);
  assert.match(js, /A durable evidence reference is required/);

  assert.match(vite, /compatibilityExtensions/);
  assert.match(vite, /\.html/);
  assert.match(vite, /\.js/);
  assert.match(vite, /\.css/);
});
