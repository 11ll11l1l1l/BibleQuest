import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fn = readFileSync('supabase/functions/bq-push-delivery/index.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260914072000_push_subscriptions.sql', 'utf8');
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
for (const field of ['input?.title','input?.body','input?.endpoint','input?.userId']) lacks(fn, field, `caller must not control ${field}`);

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

// Private material stays server-only; cleanup remains exact and permanent-only.
has(fn, "Deno.env.get('VAPID_PRIVATE_KEY')", 'private VAPID key must be server environment only');
has(fn, 'webpush.sendNotification', 'server-side delivery must exist');
has(fn, '{ TTL: 300 }', 'push TTL must remain bounded');
has(fn, 'statusCode === 404 || statusCode === 410', 'cleanup must be limited to permanent invalidation');
has(fn, ".delete()\n            .eq('id', subscription.id)\n            .eq('user_id', notification.user_id)", 'cleanup must delete exact recipient-owned row');
for (const forbidden of ['console.log(privateKey','console.error(privateKey','console.log(subscription','console.error(subscription','return response({ endpoint','return response({ p256dh']) lacks(fn, forbidden, `sensitive push material must not be exposed: ${forbidden}`);

console.log('V5 push delivery compatibility/security: PASS');
