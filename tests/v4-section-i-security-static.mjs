import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const schema=read('supabase/schema.sql');
const assignmentsSql=read('supabase/migrations/20260904_assignments_presence_unlocks.sql');
const groupsSql=read('supabase/migrations/20260904_journey_groups_daily_loop.sql');
const couplesSql=read('supabase/migrations/20260905071100_couple_shared_write_hardening.sql');
const bootstrap=read('src/app/bootstrap.js');
const owners={
  assignments:read('src/app/assignments.js'),
  groups:read('src/app/journey-groups.js'),
  teams:read('src/app/team-center.js'),
  couples:read('src/app/couples-cloud.js'),
  rooms:read('src/app/live-rooms.js')
};

const has=(text,token,message)=>assert.ok(text.includes(token),message);

for(const table of[
  'bible_profiles','bible_attempts','bible_mastery','bible_congregations','bible_congregation_members',
  'bible_teams','bible_team_members','bible_shared_sessions','bible_session_participants','bible_score_events','bible_user_badges'
]) has(schema,`alter table public.${table} enable row level security`,`${table} must keep RLS enabled.`);

for(const token of[
  'profiles read own','attempts read own','mastery read own','votes read own',
  'congregations member read','members congregation read','teams congregation read','team members congregation read',
  'sessions congregation read','participants congregation read','score events congregation read'
]) has(schema,`create policy "${token}"`,`Security policy ${token} is missing.`);

has(schema,'-- No INSERT/UPDATE/DELETE policy for score events: trusted backend only.','Score events must remain trusted-backend writes only.');
has(schema,'grant select on public.bible_score_events, public.bible_badge_catalog, public.bible_user_badges to authenticated;','Authenticated clients must keep read-only score/badge grants.');
has(schema,'user_id=(select auth.uid())','Core browser-facing policies must remain bound to auth.uid().');

for(const token of[
  'private.bible_assignment_visible','if viewer is null then return false','if viewer_role is null then return false',
  'user_id=(select auth.uid()) or exists','presence own insert','presence own update','presence own delete'
]) has(assignmentsSql,token,`Assignments/presence security contract lost ${token}.`);

for(const token of[
  'private.is_bible_group_member','private.shares_bible_group','journey groups member read','journey group members read',
  'daily journey own insert','daily journey own update','encouragement group insert','sender_id=(select auth.uid())'
]) has(groupsSql,token,`Journey Groups security contract lost ${token}.`);

has(couplesSql,'revoke update on table public.bible_couple_shared from authenticated','Couple shared history must remain append-only for authenticated browser clients.');
has(couplesSql,'drop policy if exists "couple shared pair update"','Broad couple-shared browser update policy must remain removed.');

for(const [name,source] of Object.entries(owners)){
  assert.ok(!/\bfetch\s*\(/.test(source),`${name} owner must not bypass the shared API boundary with direct fetch().`);
  assert.ok(!/supabase\.co/i.test(source),`${name} owner must not hard-code a production Supabase endpoint.`);
  assert.ok(!/service[_-]?role/i.test(source),`${name} owner must not contain service-role credentials or shortcuts.`);
}

for(const [factory,modulePath] of[
  ['createAssignmentsService','./assignments.js'],['createJourneyGroupsService','./journey-groups.js'],['createTeamCenterService','./team-center.js'],
  ['createCouplesCloudService','./couples-cloud.js'],['createLiveRoomsService','./live-rooms.js']
]){
  assert.equal((bootstrap.match(new RegExp(`import \\{ ${factory} \\} from '${modulePath.replace('.','\\.')}'`,'g'))||[]).length,1,`${factory} must have exactly one bootstrap import owner.`);
  assert.equal((bootstrap.match(new RegExp(`${factory}\\(`,'g'))||[]).length,2,`${factory} must appear only in its import and single construction call.`);
}

const jsFiles=[];
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&entry.name.endsWith('.js'))jsFiles.push(full)}};
walk(path.join(root,'src'));
for(const file of jsFiles){
  const source=fs.readFileSync(file,'utf8'),relative=path.relative(root,file);
  assert.ok(!/SUPABASE_SERVICE_ROLE|service_role_key/i.test(source),`${relative} contains a browser-shipped service-role shortcut.`);
  assert.ok(!/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(source),`${relative} hard-codes a production Supabase project URL.`);
}

for(const [name,token] of[
  ['assignments','resetAccountState'],['groups','contextUserId'],['teams','contextUserId'],['couples','contextUserId'],['rooms','membershipUserId!==userId']
]) has(owners[name],token,`${name} owner must explicitly invalidate account-scoped in-memory state.`);

console.log('BibleQuest V4 Section I security/privacy static contracts passed.');