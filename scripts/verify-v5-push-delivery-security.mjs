import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fn = readFileSync('supabase/functions/bq-push-delivery/index.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260914072000_push_subscriptions.sql', 'utf8');

const has = (text, needle, label) => assert.ok(text.includes(needle), label);
const lacks = (text, needle, label) => assert.ok(!text.includes(needle), label);

// 1) Privileged invocation is authenticated and role-gated server-side.
has(fn, "req.method !== 'POST'", 'delivery must be POST-only');
has(fn, 'adminDb.auth.getUser(jwt)', 'caller JWT must be verified by Supabase Auth');
has(fn, ".from('bible_app_access')", 'caller access must be checked from authoritative access rows');
has(fn, "!['owner', 'admin'].includes", 'only active owner/admin callers may invoke delivery');
has(fn, 'Authentication required', 'missing/invalid authentication must fail closed');
has(fn, 'Admin access required', 'insufficient role must fail closed');

// 2) Notification Center remains authoritative; arbitrary caller-supplied push copy is not accepted.
has(fn, "const notificationId = String(input?.notificationId", 'request must accept an existing notification identity');
has(fn, ".from('bible_notifications')", 'delivery must load the authoritative notification row');
has(fn, ".select('id,user_id,notification_type,title,body,action_kind')", 'server must derive push payload from the stored notification');
lacks(fn, 'input?.title', 'caller must not supply arbitrary push title');
lacks(fn, 'input?.body', 'caller must not supply arbitrary push body');
lacks(fn, 'input?.endpoint', 'caller must not supply arbitrary push endpoint');
lacks(fn, 'input?.userId', 'caller must not choose an arbitrary target user');

// 3) Delivery is scoped to the notification recipient and explicit category opt-in.
has(fn, ".from('bible_push_subscriptions')", 'delivery must use the integrated push-subscription owner');
has(fn, ".eq('user_id', notification.user_id)", 'subscriptions must be scoped to the notification recipient');
has(fn, ".contains('enabled_categories', [category])", 'delivery must require explicit category opt-in');
has(fn, '.limit(MAX_SUBSCRIPTIONS_PER_USER)', 'fanout per user must be bounded');
has(fn, 'const MAX_SUBSCRIPTIONS_PER_USER = 20', 'fanout bound must remain small');

// 4) Private VAPID material is server-only and payload fields are bounded.
has(fn, "Deno.env.get('VAPID_PRIVATE_KEY')", 'private VAPID key must be loaded only from server environment');
has(fn, "Deno.env.get('VAPID_PUBLIC_KEY')", 'public VAPID key must be server-configured for this function');
has(fn, 'webpush.setVapidDetails', 'VAPID configuration must be applied server-side');
has(fn, 'webpush.sendNotification', 'server-side Web Push delivery must exist');
has(fn, ".slice(0, 120)", 'push title must be bounded');
has(fn, ".slice(0, 240)", 'push body must be bounded');
has(fn, '{ TTL: 300 }', 'push TTL must be bounded');
lacks(fn, 'console.log(privateKey', 'private VAPID material must never be logged');
lacks(fn, 'console.error(privateKey', 'private VAPID material must never be logged');

// 5) Only permanent push-service invalidation responses may delete a subscription.
has(fn, 'statusCode === 404 || statusCode === 410', 'cleanup must be limited to permanent 404/410 endpoint invalidation');
has(fn, ".delete()\n            .eq('id', subscription.id)\n            .eq('user_id', notification.user_id)", 'cleanup must delete only the exact recipient-owned subscription');
lacks(fn, ".eq('endpoint', subscription.endpoint)", 'cleanup must not use endpoint as the sole destructive selector');

// 6) Responses/logs expose counts/status only, not subscription secrets or endpoint material.
has(fn, 'attempted: rows.length, delivered, removed, failed', 'result must expose only aggregate delivery counts');
for (const forbidden of [
  "console.log(subscription",
  "console.error(subscription",
  "console.log('push delivery failed', { endpoint",
  "console.error('push delivery failed', { endpoint",
  'return response({ endpoint',
  'return response({ p256dh',
]) lacks(fn, forbidden, `sensitive push material must not be exposed: ${forbidden}`);

// 7) Integrated persistence remains owner-only and push categories remain opt-in/off by default.
has(migration, "enabled_categories text[] not null default '{}'::text[]", 'push categories must default OFF');
has(migration, 'alter table public.bible_push_subscriptions enable row level security', 'push subscriptions must have RLS enabled');
has(migration, 'revoke all on table public.bible_push_subscriptions from public, anon', 'public/anon subscription access must remain revoked');
has(migration, 'using ((select auth.uid()) = user_id)', 'subscription reads/mutations must remain owner-scoped');
has(migration, 'with check ((select auth.uid()) = user_id)', 'subscription writes must remain owner-scoped');
for (const category of ['assignment', 'ministry', 'recognition', 'calendar', 'media']) {
  has(migration, `'${category}'`, `allowed category missing: ${category}`);
}

console.log('V5 push delivery security: PASS');
