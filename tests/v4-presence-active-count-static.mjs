// BibleQuest V4 Phase 3: static contract for the privacy-safe presence
// aggregate and its final exposed-schema hardening.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const initial = fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260912100000_presence_active_count.sql'), 'utf8');
const grantHardening = fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260913010000_presence_active_count_grant_hardening.sql'), 'utf8');
const privateHardening = fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260913031500_presence_active_count_private_definer.sql'), 'utf8');

assert.ok(initial.includes('drop policy if exists "presence congregation read"'), 'Migration must replace the existing raw-read policy, not add a conflicting second one.');
assert.ok(/"presence congregation read" on public\.bible_presence for select to authenticated\s*\nusing \(\s*\n\s*private\.bible_role_in_congregation\(congregation_id\)\s*\n\s*= any \(array\['facilitator','leader','pastor','admin'\]\)/.test(initial), 'Raw presence rows must be restricted to ministry roles only.');
assert.ok(!/using\s*\(\s*private\.is_bible_congregation_member/.test(initial.split('presence own')[0]), 'The tightened read policy must not fall back to plain congregation membership.');

assert.ok(initial.includes('create or replace function public.bible_presence_active_count'), 'The stable public RPC signature must originate in the Phase 3 migration.');
assert.ok(initial.includes('private.is_bible_congregation_member(target_congregation)'), 'The aggregate must verify congregation membership server-side.');
assert.ok(/select count\(\*\)/.test(initial), 'The aggregate must return a bare count, never individual rows.');
assert.ok(!/select \*|select .*user_id.*from public\.bible_presence/.test(initial.split('security definer')[1] || ''), 'The aggregate body must never select user_id or full rows.');
assert.ok(initial.includes('greatest(1, least(1440, window_minutes))'), 'The window parameter must stay clamped to 1 minute through 24 hours.');

assert.ok(/revoke execute on function public\.bible_presence_active_count\(uuid, integer\)\s*\n\s*from anon, public/.test(grantHardening), 'Anon and PUBLIC execute must stay explicitly revoked.');
assert.ok(/grant execute on function public\.bible_presence_active_count\(uuid, integer\)\s*\n\s*to authenticated/.test(grantHardening), 'Only authenticated callers should receive the public RPC grant.');

assert.ok(privateHardening.includes('create or replace function private.bible_presence_active_count_impl'), 'Privileged presence counting must live in the non-exposed private schema.');
const privateImpl = privateHardening.split('create or replace function private.bible_presence_active_count_impl')[1]?.split('create or replace function public.bible_presence_active_count')[0] || '';
assert.ok(privateImpl.includes('security definer'), 'The private implementation needs SECURITY DEFINER to count rows hidden from ordinary members.');
assert.ok(privateImpl.includes("set search_path = ''"), 'The private SECURITY DEFINER must pin an empty search_path.');
assert.ok(privateImpl.includes('private.is_bible_congregation_member(target_congregation)'), 'The private implementation must authenticate congregation membership internally.');
assert.ok(privateImpl.includes('select count(*)::integer'), 'The private implementation must return only an integer aggregate.');
assert.ok(!/select \*|select .*user_id.*from public\.bible_presence/.test(privateImpl), 'The private implementation must not return raw member identity data.');
assert.ok(/revoke all on function private\.bible_presence_active_count_impl\(uuid, integer\)\s*\n\s*from public, anon/.test(privateHardening), 'The private implementation must explicitly reject PUBLIC and anon execution.');
assert.ok(/grant execute on function private\.bible_presence_active_count_impl\(uuid, integer\)\s*\n\s*to authenticated/.test(privateHardening), 'Authenticated callers need execute only so the invoker wrapper can delegate to the non-exposed function.');

const publicWrapper = privateHardening.split('create or replace function public.bible_presence_active_count')[1] || '';
assert.ok(publicWrapper.includes('security invoker'), 'The exposed public RPC must be SECURITY INVOKER, not SECURITY DEFINER.');
assert.ok(!publicWrapper.split('$$;')[0].includes('security definer'), 'No SECURITY DEFINER may remain on the exposed public wrapper.');
assert.ok(publicWrapper.includes('select private.bible_presence_active_count_impl(target_congregation, window_minutes)'), 'The public wrapper must delegate only to the private implementation.');
assert.ok(/revoke all on function public\.bible_presence_active_count\(uuid, integer\)\s*\n\s*from public, anon/.test(publicWrapper), 'The final public wrapper must keep PUBLIC and anon revoked.');
assert.ok(/grant execute on function public\.bible_presence_active_count\(uuid, integer\)\s*\n\s*to authenticated/.test(publicWrapper), 'The final public wrapper must remain signed-in only.');

console.log('BibleQuest v4 Phase 3 presence aggregate RLS/private-definer contract passed.');
