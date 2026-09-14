import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fn = readFileSync('supabase/functions/bq-push-delivery/index.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260914072000_push_subscriptions.sql', 'utf8');
const deliveryMigration = readFileSync('supabase/migrations/20260914212500_push_delivery_idempotency.sql', 'utf8');
const notificationsMigration = readFileSync('supabase/migrations/20260905_biblequest_production_upgrade_v1.sql', 'utf8');
const router = readFileSync('src/app/router.js', 'utf8');
const bootstrap = readFileSync('src/app/bootstrap.js', 'utf8');

const has = (text, needle, label) => assert.ok(text.includes(needle), label);
const lacks = (text, needle, label) => assert.ok(!text.includes(needle), label);

// Privileged invocation remains server-authoritative.
has(fn, "req.method !== 'POST'", 'delivery must be POST-only');
has(fn, 'adminDb.auth.getUser(jwt)', 'caller JWT must be verified');
has(fn, ".from('bible_app_access')", 'caller access must be authoritative');
has(fn, "!['owner', 'admin'].includes", 'delivery must remain owner/admin only');
has(fn, "const notificationId = String(input?.notificationId", 'request accepts only existing notification identity');
has(fn, ".from('bible_notifications')", 'Notification Center row remains source of truth');
for (const field of ['input?.title','input?.body','input?.endpoint','input?.userId','input?.createdAt','input?.created_at']) lacks(fn, field, `caller must not control ${field}`);

// Freshness/replay window must use the persisted Notification Center timestamp and fail closed.
has(notificationsMigration, 'create table if not exists public.bible_notifications', 'current notification schema must remain explicit');
has(notificationsMigration, 'expires_at timestamptz,created_at timestamptz not null default now()', 'notification schema must provide server-owned created_at');
has(fn, "action_kind,created_at')", 'sender must load persisted notification creation time');
has(fn, 'const MAX_NOTIFICATION_AGE_MS = 15 * 60 * 1000;', 'delivery replay window must remain bounded');
has(fn, 'const MAX_FUTURE_SKEW_MS = 60 * 1000;', 'future clock-skew tolerance must remain bounded');
has(fn, 'function isNotificationFresh(createdAt: unknown, nowMs = Date.now())', 'sender must own freshness evaluation');
has(fn, "typeof createdAt !== 'string' || !createdAt.trim()", 'missing persisted timestamp must fail closed');
has(fn, 'const createdAtMs = Date.parse(createdAt);', 'persisted timestamp must be parsed');
has(fn, 'if (!Number.isFinite(createdAtMs)) return false;', 'invalid persisted timestamp must fail closed');
has(fn, 'ageMs >= -MAX_FUTURE_SKEW_MS && ageMs <= MAX_NOTIFICATION_AGE_MS', 'future and stale notifications must be rejected');
has(fn, 'if (!isNotificationFresh(notification.created_at))', 'freshness guard must consume persisted created_at');
has(fn, "Notification is outside the push delivery window' }, 409", 'out-of-window notification must fail before delivery');
const freshnessGuard = fn.indexOf('if (!isNotificationFresh(notification.created_at))');
const subscriptionLookup = fn.indexOf(".from('bible_push_subscriptions')");
const vapidSetup = fn.indexOf('vapid();');
const outboundSend = fn.indexOf('webpush.sendNotification');
assert.ok(freshnessGuard >= 0 && freshnessGuard < subscriptionLookup, 'freshness guard must precede subscription lookup');
assert.ok(freshnessGuard < vapidSetup, 'freshness guard must precede VAPID setup');
assert.ok(freshnessGuard < outboundSend, 'freshness guard must precede outbound push');

// Storage/category contract remains explicit opt-in and owner-scoped.
has(fn, ".eq('user_id', notification.user_id)", 'subscription query must target notification recipient');
has(fn, ".contains('enabled_categories', [category])", 'delivery must require category opt-in');
has(fn, '.limit(MAX_SUBSCRIPTIONS_PER_USER)', 'fanout must be bounded');
has(migration, "enabled_categories text[] not null default '{}'::text[]", 'push categories default OFF');
has(migration, "array['assignment','ministry','recognition','calendar','media']", 'sender categories must match persisted category vocabulary');

// Sender payload matches the worker boundary: title/body/notificationId/type/url.
has(fn, 'notificationId: notification.id', 'payload must preserve notification identity');
has(fn, 'type: category', 'payload type must use persisted category vocabulary');
has(fn, 'url: routeFor(category)', 'payload must expose worker-compatible url');
lacks(fn, 'path: routeFor(category)', 'legacy path field must not return');
lacks(fn, 'category,\n    });', 'payload must not use category instead of worker type');

// URLs must follow the actual same-origin hash router, never invented path/query routing.
has(router, "const next = `#/${target}`", 'current router contract must remain hash based');
has(bootstrap, "'notification-center':()=>notificationCenterPage", 'notification-center route must exist');
for (const [category, route] of [
  ['assignment','/#/assignments'],
  ['calendar','/#/calendar'],
  ['media','/#/media'],
  ['recognition','/#/recognition'],
]) {
  has(fn, `category === '${category}'`, `route mapping missing for ${category}`);
  has(fn, `return '${route}'`, `sender route must use current hash route ${route}`);
}
has(fn, "return '/#/notification-center'", 'ministry/default push must land on Notification Center');
lacks(fn, "return '/notifications'", 'nonexistent path route must not return');
lacks(fn, "return '/assignments'", 'non-hash assignment route must not return');

// Subscription-controlled network targets must fail closed before privileged outbound delivery.
has(fn, 'function safePushEndpoint(endpoint: unknown)', 'sender must validate persisted endpoint text before delivery');
has(fn, "url.protocol !== 'https:'", 'push endpoint must require HTTPS');
has(fn, 'url.username || url.password || url.hash', 'credentials/fragments must be rejected');
has(fn, 'isBlockedPushHost(url.hostname)', 'endpoint hostname must pass local/private target screening');
for (const marker of [
  "host === 'localhost'",
  "host.startsWith('::ffff:')",
  "a === 10",
  "a === 127",
  "a === 169 && b === 254",
  "a === 172 && b >= 16 && b <= 31",
  "a === 192 && b === 168",
  "'.internal'",
  "'.local'",
]) has(fn, marker, `endpoint target screening missing ${marker}`);
has(fn, 'const endpoint = safePushEndpoint(subscription.endpoint);', 'subscription endpoint must be screened before send');
has(fn, "console.error('push endpoint rejected')", 'rejected endpoint must be recorded without endpoint material');
has(fn, 'endpoint,\n            keys:', 'send must use validated endpoint value');
lacks(fn, 'endpoint: subscription.endpoint', 'raw subscription endpoint must never reach privileged sender');

// Idempotency is isolated from Notification Center semantics and unavailable to clients.
has(deliveryMigration, 'create table if not exists public.bible_push_delivery_ledger', 'delivery ledger must be explicit and isolated');
has(deliveryMigration, 'notification_id uuid not null references public.bible_notifications(id) on delete cascade', 'ledger must bind the persisted notification');
has(deliveryMigration, 'subscription_id uuid not null references public.bible_push_subscriptions(id) on delete cascade', 'ledger must bind the exact subscription');
has(deliveryMigration, 'primary key (notification_id, subscription_id)', 'one notification/subscription claim must be unique');
has(deliveryMigration, 'alter table public.bible_push_delivery_ledger enable row level security;', 'ledger must have RLS enabled');
has(deliveryMigration, 'revoke all on table public.bible_push_delivery_ledger from anon, authenticated;', 'client roles must have no ledger privileges');
lacks(deliveryMigration, 'create policy', 'ledger must expose no client RLS policy');
has(deliveryMigration, 'grant select, insert, update, delete on table public.bible_push_delivery_ledger to service_role;', 'ledger must remain service-role only');
has(deliveryMigration, 'create or replace function public.bible_claim_push_delivery(', 'sender must use one bounded atomic claim primitive');
has(deliveryMigration, 'security definer', 'claim primitive must execute under its server-owned definition');
has(deliveryMigration, 'on conflict (notification_id, subscription_id) do nothing', 'duplicate/replayed claim must fail closed');
has(deliveryMigration, 'revoke all on function public.bible_claim_push_delivery(uuid, uuid) from public, anon, authenticated;', 'client roles must not invoke the claim primitive');
has(deliveryMigration, 'grant execute on function public.bible_claim_push_delivery(uuid, uuid) to service_role;', 'service role alone may invoke the claim primitive');
lacks(deliveryMigration, 'alter table public.bible_notifications add column', 'idempotency must not overload Notification Center rows');

has(fn, "adminDb.rpc('bible_claim_push_delivery'", 'sender must atomically claim before outbound delivery');
has(fn, 'if (!claimed)', 'duplicate/replayed delivery must be skipped');
has(fn, 'skipped += 1;', 'deduplicated attempts must be counted without exposing sensitive data');
has(fn, ".from('bible_push_delivery_ledger')\n    .update({ delivered_at:", 'successful delivery must be finalized in the ledger');
has(fn, 'async function releaseFailedDeliveryClaim', 'known failed deliveries must be retryable');
has(fn, ".delete()\n    .eq('notification_id', notificationId)\n    .eq('subscription_id', subscriptionId)\n    .is('delivered_at', null)", 'only the exact unfinished claim may be released');
has(fn, 'if (remoteAccepted)', 'unknown post-send finalization state must fail closed rather than release a possibly delivered claim');
has(fn, "console.error('push delivery finalization failed')", 'post-send finalization failure must not disclose delivery material');
const endpointGuard = fn.indexOf('const endpoint = safePushEndpoint(subscription.endpoint);');
const claimCall = fn.indexOf('const claimed = await claimDelivery(adminDb, notification.id, subscription.id);');
assert.ok(endpointGuard >= 0 && endpointGuard < claimCall, 'invalid endpoint must be rejected before consuming a delivery claim');
assert.ok(claimCall >= 0 && claimCall < outboundSend, 'atomic claim must precede outbound push');

// Redirects are failures, while permanent endpoint invalidation alone triggers cleanup.
has(fn, 'statusCode >= 300 && statusCode < 400', 'push-service redirect status must fail closed');
has(fn, "console.error('push delivery redirect rejected', { statusCode })", 'redirect rejection must avoid target disclosure');
has(fn, 'statusCode === 404 || statusCode === 410', 'cleanup must be limited to permanent invalidation');
has(fn, ".delete()\n            .eq('id', subscription.id)\n            .eq('user_id', notification.user_id)", 'cleanup must delete exact recipient-owned row');

// Private material stays server-only.
has(fn, "Deno.env.get('VAPID_PRIVATE_KEY')", 'private VAPID key must be server environment only');
has(fn, 'webpush.sendNotification', 'server-side delivery must exist');
has(fn, '{ TTL: 300 }', 'push TTL must remain bounded');
for (const forbidden of ['console.log(privateKey','console.error(privateKey','console.log(subscription','console.error(subscription','return response({ endpoint','return response({ p256dh','console.log(notification.created_at','console.error(notification.created_at']) lacks(fn, forbidden, `sensitive push material must not be exposed: ${forbidden}`);

console.log('V5 push delivery compatibility/security/idempotency: PASS');
