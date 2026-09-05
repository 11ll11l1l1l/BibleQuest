import fs from 'node:fs';
import assert from 'node:assert/strict';

const center=fs.readFileSync('team-center.js','utf8');
const edge=fs.readFileSync('supabase/functions/bq-team/index.ts','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.match(index,/team-center\.js/,'Cloud Teams manager must load in production');
assert.match(edge,/leaderRoles=new Set\(\['facilitator','leader','pastor','admin'\]\)/,'team mutations must remain ministry-role gated');
assert.match(edge,/team_type:'game_team'/,'team creation must use the existing database team type contract');
assert.match(edge,/activeMembership\(admin,congregationId,targetUserId\)/,'added users must be active congregation members');
assert.match(edge,/team creator stays a member/i,'active team creator must not be removable from membership');
assert.match(center,/select\('id,name,team_type'\)/,'assignment team selector must use the real team_type schema');
assert.match(center,/Manage Cloud Teams/,'assignment workflow must expose team management');
assert.match(center,/title!==['"]Together['"]/,'Together hub integration must be explicit');
assert.match(center,/CLOUD MEMBERSHIP/,'cloud roster should expose team management to authorized leaders');

console.log('cloud team static contracts: ok');
