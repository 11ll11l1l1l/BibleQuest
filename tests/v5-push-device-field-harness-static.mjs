import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../v5-push-device-field.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../v5-push-device-field.js', import.meta.url), 'utf8');
const bootstrap = await readFile(new URL('../src/app/bootstrap.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /QA ONLY — V5 DEVICE\/FIELD HARNESS/);
assert.match(html, /noindex,nofollow,noarchive/);
assert.match(html, /v5-push-device-field\.js/);

for (const forbidden of [
  'sb_secret_',
  'service_role',
  'SUPABASE_SERVICE_ROLE_KEY',
  'privateKey',
  'VAPID_PRIVATE',
  'bq-push-delivery'
]) {
  assert.equal(js.includes(forbidden), false, `field harness must not contain privileged material/action: ${forbidden}`);
}

assert.match(js, /createPushSubscriptionService/);
assert.match(js, /createPushSubscriptionPersistence/);
assert.match(js, /createPushSubscriptionRepository/);
assert.match(js, /push\.enable\(\['assignment'\]\)/);
assert.match(js, /push\.disable\(\)/);
assert.match(js, /serviceWorker\.register\('\/offline-shell-sw\.js'/);
assert.match(js, /mybiblequest\.pages\.dev/);
assert.match(js, /client\.from\('bible_push_subscriptions'\)/);

assert.equal(bootstrap.includes('v5-push-device-field'), false, 'field harness must remain outside normal bootstrap');
assert.equal(index.includes('v5-push-device-field'), false, 'field harness must remain unlinked from normal app');

console.log('PASS V5 push device field harness static safety contract');
