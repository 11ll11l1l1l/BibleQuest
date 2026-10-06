import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL(
  '../../supabase/migrations/20261007083000_v7_library_automated_review_audit.sql',
  import.meta.url
), 'utf8');

test('Lane B persists truthful automated and human Library review identities', () => {
  assert.match(sql, /create table if not exists public\.v7_library_review_decisions/);
  assert.match(sql, /reviewer_type text not null check \(reviewer_type in \('automated_policy','human'\)\)/);
  assert.match(sql, /decision in \('auto_approved','needs_repair','rejected'\)/);
  assert.match(sql, /decision in \('approved','request_changes','rejected'\)/);
  assert.match(sql, /reviewer_type = 'automated_policy'[\s\S]*reviewer_id is null/);
  assert.match(sql, /reviewer_type = 'human'[\s\S]*reviewer_id is not null/);
});

test('browser reviewers cannot impersonate the automated policy', () => {
  assert.match(sql, /create policy "v7 library human review insert"/);
  assert.match(sql, /reviewer_type = 'human'/);
  assert.match(sql, /reviewer_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(sql, /grant update.*v7_library_review_decisions/i);
  assert.doesNotMatch(sql, /grant delete.*v7_library_review_decisions/i);
});

test('automated publication requires an exact auditable matching decision', () => {
  assert.match(sql, /v7_guard_library_automated_publication/);
  assert.match(sql, /d\.decision = 'auto_approved'/);
  assert.match(sql, /d\.policy_id = new\.review_policy_id/);
  assert.match(sql, /d\.policy_version = new\.review_policy_version/);
  assert.match(sql, /d\.decided_at = new\.reviewed_at/);
  assert.match(sql, /jsonb_array_length\(d\.criteria\) > 0/);
  assert.match(sql, /d\.second_pass ->> 'result' = 'pass'/);
  assert.match(sql, /d\.second_pass ->> 'revision' = new\.id::text/);
  assert.match(sql, /jsonb_array_length\(d\.evidence_refs\) > 0/);
});

test('review history is immutable and reviewer access remains RLS-scoped', () => {
  assert.match(sql, /enable row level security/);
  assert.match(sql, /private\.bible_can_review_content\(i\.congregation_id\)/);
  assert.match(sql, /V7 Library review decisions are immutable audit history/);
});


test('Lane B provides a service-role-only atomic automated review and publication transition',()=>{
  assert.match(sql,/create or replace function public\.bible_v7_apply_automated_library_review/);
  assert.match(sql,/p_decision not in \('auto_approved','needs_repair','rejected'\)/);
  assert.match(sql,/translation_semantic_fidelity/);
  assert.match(sql,/Auto-publication requires every policy criterion exactly once/);
  assert.match(sql,/Auto-publication second pass must be independent from primary evaluators/);
  assert.match(sql,/set review_status = 'approved'/);
  assert.match(sql,/publication_state = 'published'/);
  assert.match(sql,/grant execute on function public\.bible_v7_apply_automated_library_review[\s\S]*to service_role/);
  assert.match(sql,/revoke all on function public\.bible_v7_apply_automated_library_review[\s\S]*from public,anon,authenticated/);
});
