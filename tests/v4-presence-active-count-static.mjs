// BibleQuest V4 Phase 3: static contract for the privacy-safe presence
// aggregate migration. CI cannot execute real Postgres (documented gap), so
// this locks in the exact policy/function text as the closest available
// proof, pending real database verification.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260912100000_presence_active_count.sql'), 'utf8');

assert.ok(sql.includes('drop policy if exists "presence congregation read"'), 'Migration must replace the existing raw-read policy, not add a conflicting second one.');
assert.ok(/"presence congregation read" on public\.bible_presence for select to authenticated\s*\nusing \(\s*\n\s*private\.bible_role_in_congregation\(congregation_id\)\s*\n\s*= any \(array\['facilitator','leader','pastor','admin'\]\)/.test(sql), 'Raw presence rows must be restricted to ministry roles only.');
assert.ok(!/using\s*\(\s*private\.is_bible_congregation_member/.test(sql.split('presence own')[0]), 'The tightened read policy must not fall back to plain congregation membership (that was the original over-broad rule).');

assert.ok(sql.includes('create or replace function public.bible_presence_active_count'), 'The privacy-safe aggregate function must exist.');
assert.ok(sql.includes('security definer'), 'The aggregate function must run as security definer to safely check membership without granting raw table access.');
assert.ok(sql.includes("set search_path = ''"), 'The aggregate function must pin an empty search_path (standard hardening for this codebase\u2019s security-definer functions).');
assert.ok(sql.includes('private.is_bible_congregation_member(target_congregation)'), 'The aggregate function must verify the caller belongs to the target congregation server-side.');
assert.ok(/select count\(\*\)/.test(sql), 'The function must return a bare count, never individual rows.');
assert.ok(!/select \*|select .*user_id.*from public\.bible_presence/.test(sql.split('security definer')[1] || ''), 'The aggregate function body must never select user_id or full rows.');
assert.ok(sql.includes('greatest(1, least(1440, window_minutes))'), 'The window parameter must be clamped to a sane range (1 minute to 24 hours) to prevent abuse.');
assert.ok(sql.includes('grant execute on function public.bible_presence_active_count(uuid, integer) to authenticated'), 'Ordinary authenticated members must be able to call the aggregate.');
assert.ok(sql.includes('revoke all on function public.bible_presence_active_count(uuid, integer) from public'), 'The aggregate function must not be callable by the anonymous/public role.');

console.log('BibleQuest v4 Phase 3 presence aggregate RLS/function contract passed.');
