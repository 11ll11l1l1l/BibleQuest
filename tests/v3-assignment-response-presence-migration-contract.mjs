import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const path = process.argv[2];
assert.ok(path, 'Usage: node tests/v3-assignment-response-presence-migration-contract.mjs <migration.sql>');
const sql = fs.readFileSync(path, 'utf8');
const lower = sql.toLowerCase();
const requirePattern = (pattern, label) => assert.match(sql, pattern, label);

const gitBlobSha = crypto.createHash('sha1').update(`blob ${Buffer.byteLength(sql)}\0`).update(sql).digest('hex');
assert.equal(gitBlobSha, 'bbbceb057c631f08ec32826384ef6fcd61da4527', 'Migration bytes differ from reviewed Assignment-line blob');

requirePattern(/create or replace function private\.bible_assignment_visible\s*\(/i, 'Missing assignment visibility helper');
requirePattern(/language plpgsql stable security definer set search_path\s*=\s*''/i, 'Visibility helper must be stable SECURITY DEFINER with empty search_path');
requirePattern(/viewer_role in \('facilitator','leader','pastor','admin'\)/i, 'Missing ministry-role visibility rule');
requirePattern(/target_scope='member'.*target_id=viewer/is, 'Missing member-scope self rule');
requirePattern(/target_scope='team'.*public\.bible_team_members/is, 'Missing team membership rule');
requirePattern(/target_scope='group'.*public\.bible_group_members.*public\.bible_groups/is, 'Missing group membership/group validation rule');
requirePattern(/g\.active.*g\.congregation_id=target_congregation/is, 'Group scope must require active group in target congregation');

requirePattern(/create table if not exists public\.bible_assignment_response_presence\s*\(/i, 'Missing presence projection table');
requirePattern(/alter table public\.bible_assignment_response_presence enable row level security/i, 'Presence projection must enable RLS');
requirePattern(/revoke all on public\.bible_assignment_response_presence from anon/i, 'Anon access must be revoked');
requirePattern(/revoke insert, update, delete on public\.bible_assignment_response_presence from authenticated/i, 'Authenticated clients must not mutate projection');
requirePattern(/grant select on public\.bible_assignment_response_presence to authenticated/i, 'Authenticated SELECT grant missing');
requirePattern(/create policy assignment_response_presence_select[\s\S]*private\.bible_assignment_visible\(/i, 'Presence SELECT policy must use assignment visibility helper');

const projectionBlock = sql.match(/create table if not exists public\.bible_assignment_response_presence\s*\(([\s\S]*?)\);/i)?.[1] ?? '';
assert.ok(projectionBlock, 'Could not isolate presence projection columns');
assert.doesNotMatch(projectionBlock, /answer|feedback|response_text|response_body|notes/i, 'Peer-visible projection must not contain private response/feedback fields');

requirePattern(/create or replace function private\.bible_sync_assignment_response_presence\(\)[\s\S]*security definer[\s\S]*set search_path\s*=\s*''/i, 'Sync trigger function must be SECURITY DEFINER with empty search_path');
requirePattern(/revoke all on function private\.bible_sync_assignment_response_presence\(\) from public/i, 'Sync function public EXECUTE must be revoked');
requirePattern(/revoke all on function private\.bible_sync_assignment_response_presence\(\) from anon/i, 'Sync function anon EXECUTE must be revoked');
requirePattern(/revoke all on function private\.bible_sync_assignment_response_presence\(\) from authenticated/i, 'Sync function authenticated EXECUTE must be revoked');
requirePattern(/if tg_op = 'DELETE'[\s\S]*delete from public\.bible_assignment_response_presence/i, 'DELETE must remove projection presence');
requirePattern(/new\.status <> 'completed' or new\.completed_at is null[\s\S]*delete from public\.bible_assignment_response_presence/i, 'Uncompleted progress must remove projection presence');
requirePattern(/insert into public\.bible_assignment_response_presence[\s\S]*on conflict \(assignment_id, user_id\) do update/i, 'Completed progress must upsert projection presence');
requirePattern(/create trigger bible_assignment_response_presence_sync[\s\S]*after insert or update of status, completed_at or delete[\s\S]*on public\.bible_assignment_progress/i, 'Expected progress synchronization trigger missing');

const inserts = lower.match(/insert into public\.bible_assignment_response_presence/g) ?? [];
assert.ok(inserts.length >= 2, 'Expected trigger upsert plus existing-completion backfill');
requirePattern(/from public\.bible_assignment_progress p[\s\S]*where p\.status = 'completed'[\s\S]*on conflict \(assignment_id, user_id\) do update/i, 'Existing completed progress must be backfilled idempotently');

console.log(`BibleQuest assignment response presence migration contract: PASS (${gitBlobSha})`);
