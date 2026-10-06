import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const foundation = readFileSync(
  new URL('../../supabase/migrations/20261004051000_v7_library_discipleship_foundation.sql', import.meta.url),
  'utf8',
);
const hardening = readFileSync(
  new URL('../../supabase/migrations/20261006181500_v7_one2one_stale_tenant_hardening.sql', import.meta.url),
  'utf8',
);

test('pair authorization proves current congregation membership instead of trusting stale pair participation', () => {
  assert.match(hardening, /create or replace function private\.v7_pair_has_user/);
  assert.match(hardening, /from public\.bible_congregation_members me[\s\S]*me\.congregation_id = p\.congregation_id[\s\S]*me\.user_id = target_user[\s\S]*me\.active/);
  assert.match(hardening, /not require_active[\s\S]*p\.state = 'active'[\s\S]*mentor_membership\.user_id = p\.mentor_id[\s\S]*mentor_membership\.active[\s\S]*mentee_membership\.user_id = p\.mentee_id[\s\S]*mentee_membership\.active/);
});

test('pair row read keeps INSERT RETURNING compatible while rejecting inactive congregation members', () => {
  const pairPolicy = hardening.match(/create policy "v7 pair participant read"[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(pairPolicy, /\(select auth\.uid\(\)\) in \(mentor_id, mentee_id\)/);
  assert.match(pairPolicy, /from public\.bible_congregation_members membership/);
  assert.match(pairPolicy, /membership\.congregation_id = public\.v7_mentor_pairs\.congregation_id/);
  assert.match(pairPolicy, /membership\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(pairPolicy, /membership\.active/);
  assert.doesNotMatch(pairPolicy, /v7_pair_has_user/);
});

test('mentor assignment updates and learner progress writes fail closed when pair tenant context is stale', () => {
  const assignmentPolicy = hardening.match(/create policy "v7 pair assignment mentor update"[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(assignmentPolicy, /p\.mentor_id = \(select auth\.uid\(\)\)/);
  assert.match(assignmentPolicy, /private\.v7_pair_has_user\(p\.id, \(select auth\.uid\(\)\), true\)/);

  const progressInsert = hardening.match(/create policy "v7 progress learner insert"[\s\S]*?\n\);/i)?.[0] ?? '';
  const progressUpdate = hardening.match(/create policy "v7 progress learner update"[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(progressInsert, /p\.mentee_id = \(select auth\.uid\(\)\)/);
  assert.match(progressInsert, /private\.v7_pair_has_user\(p\.id, \(select auth\.uid\(\)\), true\)/);
  assert.match(progressUpdate, /private\.v7_pair_has_user\(p\.id, \(select auth\.uid\(\)\), true\)/);
});

test('response editing is tenant-scoped without removing learner-owned private history', () => {
  const responseInsert = hardening.match(/create policy "v7 response learner insert"[\s\S]*?\n\);/i)?.[0] ?? '';
  const responseUpdate = hardening.match(/create policy "v7 response learner update"[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(responseInsert, /private\.v7_pair_has_user\(p\.id, \(select auth\.uid\(\)\), true\)/);
  assert.match(responseUpdate, /private\.v7_pair_has_user\(p\.id, \(select auth\.uid\(\)\), true\)/);

  assert.match(foundation, /create policy "v7 response learner read"[\s\S]*learner_id=\(select auth\.uid\(\)\)/);
  assert.match(foundation, /create policy "v7 response owner delete"[\s\S]*learner_id=\(select auth\.uid\(\)\)/);
  assert.doesNotMatch(hardening, /drop policy if exists "v7 response learner read"/i);
  assert.doesNotMatch(hardening, /drop policy if exists "v7 response owner delete"/i);
});

test('shared response access closes for stale mentors while learners retain revocation authority', () => {
  assert.match(hardening, /create or replace function private\.v7_response_share_authorized/);
  assert.match(hardening, /not require_active[\s\S]*private\.v7_pair_has_user\(p\.id, target_user, true\)/);

  const shareRead = hardening.match(/create policy "v7 response share participant read"[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(shareRead, /private\.v7_response_is_owned\(response_id, \(select auth\.uid\(\)\)\)/);
  assert.match(shareRead, /recipient_id = \(select auth\.uid\(\)\)/);
  assert.match(shareRead, /private\.v7_pair_has_user\(a\.pair_id, \(select auth\.uid\(\)\), true\)/);

  assert.match(foundation, /create policy "v7 response share owner update"[\s\S]*v7_response_share_authorized\(response_id,\(select auth\.uid\(\)\),recipient_id,false\)/);
});
