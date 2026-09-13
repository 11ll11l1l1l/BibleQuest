import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(
  new URL('../supabase/migrations/20260914072000_push_subscriptions.sql', import.meta.url),
  'utf8',
);
const compact = migration.replace(/\s+/g, ' ').toLowerCase();

const mustMatch = (pattern, message) => assert.match(compact, pattern, message);

test('push subscriptions persist only minimum current-architecture delivery material', () => {
  mustMatch(/create table if not exists public\.bible_push_subscriptions/, 'subscription table must exist');
  mustMatch(/user_id uuid not null references auth\.users\(id\) on delete cascade/, 'subscriptions must be bound to an Auth account');
  mustMatch(/endpoint text not null/, 'endpoint is required');
  mustMatch(/p256dh text not null/, 'p256dh is required');
  mustMatch(/auth text not null/, 'auth secret is required');
  assert.doesNotMatch(compact, /vapid[_ -]?private|private[_ -]?key|service[_ -]?role/, 'server-only secrets must not be persisted in browser subscription rows');
});

test('one physical push endpoint cannot silently remain attached to multiple accounts', () => {
  mustMatch(/constraint bible_push_subscriptions_endpoint_unique unique \(endpoint\)/, 'endpoint ownership must be globally unique');
  mustMatch(/create index if not exists bible_push_subscriptions_user_idx on public\.bible_push_subscriptions\(user_id\)/, 'account cleanup lookup should be indexed');
});

test('push categories are explicit opt-in and default completely off', () => {
  mustMatch(/enabled_categories text\[\] not null default '\{\}'::text\[\]/, 'new subscriptions must have no enabled push categories');
  for (const category of ['assignment', 'ministry', 'recognition', 'calendar', 'media']) {
    assert.ok(compact.includes(`'${category}'`), `accepted V5 push category missing: ${category}`);
  }
  mustMatch(/enabled_categories <@ array\[/, 'unknown push categories must be rejected');
});

test('RLS and grants limit subscription reads and writes to the owning authenticated account', () => {
  mustMatch(/alter table public\.bible_push_subscriptions enable row level security/, 'RLS must be enabled');
  mustMatch(/revoke all on table public\.bible_push_subscriptions from public, anon/, 'anonymous/public access must be revoked');
  mustMatch(/grant select, insert, update, delete on table public\.bible_push_subscriptions to authenticated/, 'authenticated users only receive RLS-governed CRUD');
  mustMatch(/create policy "push subscriptions own rows" on public\.bible_push_subscriptions for all to authenticated using \(\(select auth\.uid\(\)\) = user_id\) with check \(\(select auth\.uid\(\)\) = user_id\)/, 'both existing and new rows must stay owned by auth.uid()');
  assert.doesNotMatch(compact, /to anon\b|to public\b/, 'no policy may authorize anon/public roles');
});

test('subscription fields are bounded to reduce abusive row sizes', () => {
  mustMatch(/char_length\(endpoint\) between 20 and 4096/, 'endpoint must be bounded');
  mustMatch(/char_length\(p256dh\) between 16 and 1024/, 'p256dh must be bounded');
  mustMatch(/char_length\(auth\) between 8 and 512/, 'auth must be bounded');
});
