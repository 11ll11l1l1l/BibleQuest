import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap=await readFile(new URL('../src/app/bootstrap.js',import.meta.url),'utf8');
const api=await readFile(new URL('../src/core/api.js',import.meta.url),'utf8');
const onboarding=await readFile(new URL('../src/ui/push-onboarding.js',import.meta.url),'utf8');
const index=await readFile(new URL('../index.html',import.meta.url),'utf8');

assert.match(bootstrap,/createPushSubscriptionService/);
assert.match(bootstrap,/createPushSubscriptionPersistence/);
assert.match(bootstrap,/api:api\.pushSubscriptions/);
assert.match(bootstrap,/applicationServerKey:V5_PUSH_VAPID_PUBLIC_KEY/);
assert.match(bootstrap,/ownerStorage:authStorage/);
assert.match(bootstrap,/mountPushOnboarding\(\{push,session,ownerStorage:authStorage\}\)/);

assert.match(api,/const pushSubscriptions = Object\.freeze/);
assert.match(api,/bible_push_subscriptions/);
assert.match(api,/\.eq\('user_id'/);
assert.match(api,/\.eq\('endpoint'/);

assert.match(onboarding,/appinstalled/);
assert.match(onboarding,/display-mode: standalone/);
assert.match(onboarding,/data-push-onboarding-enable/);
assert.match(onboarding,/await push\.enable\(DEFAULT_CATEGORIES\)/);
assert.match(onboarding,/\['assignment','ministry','calendar'\]/);
assert.match(onboarding,/data-push-onboarding-later/);
assert.doesNotMatch(onboarding,/requestPermission\(/,'permission must remain owned by the certified push service and be reached only from the Enable button');


assert.match(index,/src\/ui\/push-onboarding\.css/);

console.log('PASS V5 production install-to-notification onboarding wiring');
