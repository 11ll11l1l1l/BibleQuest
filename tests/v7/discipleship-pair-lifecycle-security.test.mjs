import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../../supabase/migrations/20261004111500_v7_pair_lifecycle_security.sql', import.meta.url), 'utf8');

test('pair invitations cannot pre-seed acceptance or terminal lifecycle state', () => {
  assert.match(migration, /before insert on public\.v7_mentor_pairs/);
  assert.match(migration, /new\.state <> 'invited'/);
  assert.match(migration, /new\.mentor_accepted_at is not null/);
  assert.match(migration, /new\.mentee_accepted_at is not null/);
  assert.match(migration, /new\.ended_at is not null/);
});

test('invitation and lifecycle events remain append-only server-owned audit records', () => {
  assert.match(migration, /after insert on public\.v7_mentor_pairs[\s\S]*private\.v7_audit_mentor_pair_invite/);
  assert.match(migration, /insert into public\.v7_pair_events\(pair_id, actor_id, event_type, metadata\)/);
  assert.match(migration, /revoke insert, update, delete on public\.v7_pair_events from authenticated/);
  assert.doesNotMatch(migration, /grant\s+insert[^;]*v7_pair_events[^;]*authenticated/i);
});

test('pair lifecycle mutation is serialized, participant-scoped and membership-scoped', () => {
  assert.match(migration, /create or replace function public\.bible_v7_transition_mentor_pair/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /where p\.id = p_pair_id\s+for update/);
  assert.match(migration, /v_actor uuid := auth\.uid\(\)/);
  assert.match(migration, /v_actor = v_pair\.mentor_id/);
  assert.match(migration, /v_actor = v_pair\.mentee_id/);
  assert.match(migration, /from public\.bible_congregation_members m[\s\S]*m\.user_id = v_actor[\s\S]*m\.active/);
  assert.match(migration, /revoke all on function public\.bible_v7_transition_mentor_pair\(uuid,text\) from public, anon/);
  assert.match(migration, /grant execute on function public\.bible_v7_transition_mentor_pair\(uuid,text\) to authenticated/);
  assert.match(migration, /revoke update on public\.v7_mentor_pairs from authenticated/);
});

test('activation requires both participant acceptances and both active memberships', () => {
  assert.match(migration, /if v_action = 'accept' then/);
  assert.match(migration, /m\.user_id = v_pair\.mentor_id and m\.active/);
  assert.match(migration, /m\.user_id = v_pair\.mentee_id and m\.active/);
  assert.match(migration, /mentor_accepted_at = case when v_role = 'mentor'/);
  assert.match(migration, /mentee_accepted_at = case when v_role = 'mentee'/);
  assert.match(migration, /if v_pair\.mentor_accepted_at is not null and v_pair\.mentee_accepted_at is not null then[\s\S]*set state = 'active'/);
  assert.match(migration, /'accepted'.*'activated'/s);
});

test('decline and end are explicit terminal transitions while suspend and resume remain out of scope', () => {
  assert.match(migration, /elsif v_action = 'decline' then[\s\S]*set state = 'declined', ended_at = v_now/);
  assert.match(migration, /elsif v_action = 'end' then[\s\S]*v_pair\.state not in \('active','suspended'\)[\s\S]*set state = 'ended', ended_at = v_now/);
  assert.doesNotMatch(migration, /v_action = 'suspend'/);
  assert.doesNotMatch(migration, /v_action = 'resume'/);
});
