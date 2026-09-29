import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../../supabase/migrations/20260930100000_assignment_target_tenant_scope_hardening.sql', import.meta.url), 'utf8');
const assignment = readFileSync(new URL('../../supabase/functions/bq-assignment/index.ts', import.meta.url), 'utf8');
const responseEdge = readFileSync(new URL('../../tests/v3-assignment-response-auth-edge.mjs', import.meta.url), 'utf8');
const lifecycleEdge = readFileSync(new URL('../../tests/v3-assignment-publish-auth-edge.mjs', import.meta.url), 'utf8');
const progressDatabase = readFileSync(new URL('../../supabase/tests/v6-assignment-progress-tenant-rls.test.sql', import.meta.url), 'utf8');
const notificationDatabase = readFileSync(new URL('../../supabase/tests/v6-notification-producer-categories.test.sql', import.meta.url), 'utf8');

test('assignment team/group visibility and notifications match the assignment congregation', () => {
  assert.match(migration, /join public\.bible_teams t\s+on t\.id = tm\.team_id\s+and t\.congregation_id = target_congregation\s+and t\.active/);
  assert.match(migration, /join public\.bible_groups g\s+on g\.id = gm\.group_id\s+and g\.congregation_id = target_congregation\s+and g\.active/);
  assert.match(migration, /join public\.bible_teams t\s+on t\.id = tm\.team_id\s+and t\.congregation_id = new\.congregation_id\s+and t\.active/);
  assert.match(migration, /join public\.bible_groups g\s+on g\.id = gm\.group_id\s+and g\.congregation_id = new\.congregation_id\s+and g\.active/);
  assert.match(migration, /cm\.congregation_id = new\.congregation_id\s+and cm\.user_id = new\.target_id\s+and cm\.active/);
  assert.match(notificationDatabase, /foreign-congregation team membership/);
  assert.match(progressDatabase, /Team B target attached to a congregation A assignment/);
});

test('assignment authorization and lifecycle use only same-congregation active targets', () => {
  assert.match(assignment, /from\('bible_teams'\)[\s\S]*?eq\('congregation_id',assignment\.congregation_id\)[\s\S]*?eq\('active',true\)/);
  assert.match(assignment, /from\('bible_groups'\)[\s\S]*?eq\('congregation_id',assignment\.congregation_id\)[\s\S]*?eq\('active',true\)/);
  assert.match(assignment, /teamScopeResult[\s\S]*?groupScopeResult[\s\S]*?scopedTeamIds[\s\S]*?scopedGroupIds[\s\S]*?bible_team_members[\s\S]*?bible_group_members/);
  assert.match(responseEdge, /cannot satisfy an assignment target in another congregation/);
  assert.match(lifecycleEdge, /Foreign team rows do not count as recipients in this congregation/);
  assert.match(lifecycleEdge, /Foreign group rows do not count as recipients in this congregation/);
});
