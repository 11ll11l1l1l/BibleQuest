// BibleQuest V4 Phase 1: static contract for the assignment-presence RLS
// tightening migration. CI cannot execute real Postgres (documented, known
// gap - see A3-V4-001), so this locks in the exact policy text as the
// closest available proof that the intended self-only rule was written
// correctly, pending real database verification.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '20260912090000_assignment_presence_self_only.sql'), 'utf8');

assert.ok(sql.includes('drop policy if exists assignment_response_presence_select'), 'Migration must replace the existing presence-select policy, not add a conflicting second one.');
assert.ok(/using\s*\(\s*user_id = \(select auth\.uid\(\)\)/.test(sql), 'The tightened policy must lead with a plain self-only check (user_id = auth.uid()).');
assert.ok(sql.includes("= any (array['facilitator','leader','pastor','admin'])"), 'Ministry-role exception must be explicit and limited to the four defined ministry roles.');
assert.ok(!/using\s*\(\s*true\s*\)/.test(sql), 'Policy must never degrade to an unconditional true (would defeat the self-only rule).');
assert.ok(sql.includes('comment on policy'), 'The policy must carry an inline comment recording the privacy contract for future readers of the schema.');

console.log('BibleQuest v4 Phase 1 assignment-presence RLS contract passed.');
