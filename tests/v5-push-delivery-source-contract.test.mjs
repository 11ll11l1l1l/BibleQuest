import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL('../supabase/functions/bq-push-delivery/index.ts', import.meta.url),
  'utf8',
);

function between(start, end) {
  const startAt = source.indexOf(start);
  assert.notEqual(startAt, -1, `missing source boundary: ${start}`);
  const endAt = source.indexOf(end, startAt);
  assert.notEqual(endAt, -1, `missing source boundary: ${end}`);
  return source.slice(startAt, endAt);
}

test('delivery types are bounded and subscriptions explicitly opt in', () => {
  assert.match(
    source,
    /type PushCategory = 'assignment' \| 'ministry' \| 'recognition' \| 'calendar' \| 'media';/,
  );

  const selection = between(
    "const subscriptions = await adminDb",
    "if (subscriptions.error)",
  );
  assert.match(selection, /\.eq\('user_id', notification\.user_id\)/);
  assert.match(selection, /\.contains\('enabled_categories', \[category\]\)/);
  assert.match(selection, /\.limit\(MAX_SUBSCRIPTIONS_PER_USER\)/);
});

test('service credentials remain server-side and authorize only exact secret matches', () => {
  const secretBoundary = between('function serviceSecret()', 'function db()');
  assert.match(secretBoundary, /Deno\.env\.get\('SUPABASE_SECRET_KEYS'\)/);
  assert.match(secretBoundary, /Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);

  const internalAuth = between(
    'function isInternalServiceRequest',
    'async function requireAdmin',
  );
  assert.match(internalAuth, /bearer === secret \|\| apiKey === secret/);

  const payload = between(
    'const payload = JSON.stringify',
    'let delivered = 0',
  );
  assert.match(payload, /notificationId: notification\.id/);
  assert.match(payload, /type: category/);
  assert.match(payload, /url: routeFor\(category\)/);
  assert.doesNotMatch(payload, /SUPABASE_SECRET_KEYS|SUPABASE_SERVICE_ROLE_KEY|VAPID_PRIVATE_KEY|serviceSecret/);
});

test('successful delivery is claimed once and finalized idempotently', () => {
  const claim = between(
    'async function claimDelivery',
    'async function markDeliveryComplete',
  );
  assert.match(claim, /rpc\('bible_claim_push_delivery'/);
  assert.match(claim, /return claim\.data === true/);

  const finalize = between(
    'async function markDeliveryComplete',
    'async function releaseFailedDeliveryClaim',
  );
  assert.match(finalize, /\.eq\('notification_id', notificationId\)/);
  assert.match(finalize, /\.eq\('subscription_id', subscriptionId\)/);
  assert.match(finalize, /\.is\('delivered_at', null\)/);

  const sendLoop = between(
    'const claimed = await claimDelivery',
    'return response({ ok: failed === 0',
  );
  assert.ok(
    sendLoop.indexOf('if (!claimed)') < sendLoop.indexOf('await webpush.sendNotification'),
    'the delivery claim must precede the remote send',
  );
  assert.ok(
    sendLoop.indexOf('await webpush.sendNotification') < sendLoop.indexOf('await markDeliveryComplete'),
    'successful remote acceptance must precede ledger finalization',
  );
  assert.match(sendLoop, /remoteAccepted = true;[\s\S]*await markDeliveryComplete[\s\S]*delivered \+= 1;/);
  assert.match(sendLoop, /if \(remoteAccepted\) \{[\s\S]*continue;/);
});

test('only exact 404/410 responses remove a subscription', () => {
  const catchBlock = between(
    "} catch (error) {\n        const statusCode",
    "try {\n          await releaseFailedDeliveryClaim",
  );
  assert.match(catchBlock, /statusCode === 404 \|\| statusCode === 410/);
  assert.equal(
    (catchBlock.match(/\.from\('bible_push_subscriptions'\)[\s\S]*?\.delete\(\)/g) || []).length,
    1,
    'there must be exactly one subscription deletion path',
  );
  assert.match(catchBlock, /\.eq\('id', subscription\.id\)/);
  assert.match(catchBlock, /\.eq\('user_id', notification\.user_id\)/);
});

test('redirects and non-terminal failures retain subscriptions and release retry claims', () => {
  const catchBlock = between(
    "} catch (error) {\n        const statusCode",
    "try {\n          await releaseFailedDeliveryClaim",
  );
  assert.match(catchBlock, /statusCode >= 300 && statusCode < 400/);
  assert.match(catchBlock, /push delivery redirect rejected/);
  assert.match(catchBlock, /push delivery failed/);

  const release = between(
    "try {\n          await releaseFailedDeliveryClaim",
    "}\n    }\n\n    return response",
  );
  assert.match(release, /releaseFailedDeliveryClaim\(adminDb, notification\.id, subscription\.id\)/);

  const deletionGuard = catchBlock.indexOf('statusCode === 404 || statusCode === 410');
  const deletion = catchBlock.indexOf(".from('bible_push_subscriptions')");
  assert.ok(deletionGuard !== -1 && deletion > deletionGuard);
});
