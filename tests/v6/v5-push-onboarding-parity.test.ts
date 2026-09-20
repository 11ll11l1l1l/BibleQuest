import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap = await readFile(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
const api = await readFile(new URL('../../src/core/api.js', import.meta.url), 'utf8');
const onboarding = await readFile(new URL('../../src/ui/push-onboarding.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

test('V6 keeps the released V5 installed-app push onboarding in the lazy bootstrap', () => {
  assert.match(bootstrap, /import\.meta\.glob/);
  assert.match(bootstrap, /createPushSubscriptionService/);
  assert.match(bootstrap, /createPushSubscriptionPersistence/);
  assert.match(bootstrap, /api:api\.pushSubscriptions/);
  assert.match(bootstrap, /ownerStorage:authStorage/);
  assert.match(bootstrap, /mountPushOnboarding\(\{push,session,ownerStorage:authStorage\}\)/);
  assert.match(bootstrap, /pushOnboarding\.maybePrompt\(\)/);
  assert.match(bootstrap, /pushOnboarding\.dispose\(\)/);
  assert.match(bootstrap, /push\.dispose\(\)/);
});

test('V6 push onboarding remains an explicit installed-app user gesture', () => {
  assert.match(onboarding, /appinstalled/);
  assert.match(onboarding, /display-mode: standalone/);
  assert.match(onboarding, /data-push-onboarding-enable/);
  assert.match(onboarding, /await push\.enable\(DEFAULT_CATEGORIES\)/);
  assert.match(onboarding, /\['assignment','ministry','calendar'\]/);
  assert.match(onboarding, /data-push-onboarding-later/);
  assert.doesNotMatch(onboarding, /requestPermission\(/);
  assert.match(index, /src\/ui\/push-onboarding\.css/);
});

test('V6 push persistence keeps account and endpoint scoped removal', () => {
  assert.match(api, /const pushSubscriptions = Object\.freeze/);
  assert.match(api, /bible_push_subscriptions/);
  assert.match(api, /\.eq\('user_id'/);
  assert.match(api, /\.eq\('endpoint'/);
  assert.match(api, /pushSubscriptions/);
});
