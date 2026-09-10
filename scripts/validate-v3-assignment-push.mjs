import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const failures=[];
const fail=message=>failures.push(message);
const owner=read('src/app/assignments.js');
const ui=read('src/features/assignments/index.js');
const api=read('src/core/api.js');
const server=read('supabase/functions/bq-assignment/index.ts');
const contract=read('ASSIGNMENT_PUSH_V3.md');
const workflow=read('.github/workflows/v3-regression.yml');
const rootLegacy=read('assignment-advanced.js');

for(const token of['loadPublishTargets','async function publish','BQ_ASSIGNMENT_PUBLISH_FORBIDDEN','BQ_ASSIGNMENT_TARGET_STALE','linkedPublishing:false'])if(!owner.includes(token))fail(`Assignments owner missing #75 contract token: ${token}`);
if(!owner.includes("const MINISTRY_ROLES=new Set(['facilitator','leader','pastor','admin'])"))fail('Assignments owner must retain exact ministry publishing roles.');
if(!owner.includes("const TARGET_SCOPES=Object.freeze(['all','member','team','group'])"))fail('Assignments owner must retain all/member/team/group audience scopes.');
if(/linkedActivity|linked_activity/.test(owner))fail('#75 browser owner must keep linked activity outside publishing until #79.');

for(const token of['data-assignment-publisher','data-assignment-publish','data-assignment-targets','name="targetScope"','name="requiredReflection"','name="minQuizScore"','name="evidenceType"'])if(!ui.includes(token))fail(`Assignments UI missing #75 publishing control: ${token}`);
if(/linkedActivity|linked_activity/.test(ui))fail('#75 publishing UI must not expose linked activity.');
if(!ui.includes('does not send notifications or generate recurring copies'))fail('#75 UI must preserve notification/recurrence boundary.');

for(const token of["async targets(congregationId)","async create(congregationId,payload)","action:'targets'","action:'create'"])if(!api.includes(token))fail(`Central API missing trusted assignment publish boundary: ${token}`);
for(const table of['bible_assignments','bible_assignment_progress','bible_score_events']){
  const direct=new RegExp(`from\\('${table}'\\)\\s*\\.\\s*(insert|upsert|update|delete)`);
  if(direct.test(api))fail(`Browser API must not directly mutate ${table} for #75.`);
}

for(const token of["action==='targets'","leaderRoles.has(member.role)","bible_congregation_members","bible_teams","bible_groups",".eq('congregation_id',congregationId)","action==='create'"])if(!server.includes(token))fail(`Trusted assignment function missing #75 server contract: ${token}`);
if(!server.includes(".eq('active',true).maybeSingle()"))fail('Trusted assignment create must reject inactive scoped targets.');
if(!server.includes("const leaderRoles=new Set(['facilitator','leader','pastor','admin'])"))fail('Trusted assignment function must enforce exact recovered ministry role set.');

for(const token of['publishes an assignment','eligible member receives','member completes it','existing RLS-protected assignment query','existing #73/#74 behavior'])if(!contract.includes(token))fail(`Assignment Push contract missing publish→receive→complete evidence: ${token}`);
if(!contract.includes('linked_activity')||!contract.includes('#79'))fail('Assignment Push contract must retain linked-activity deferral.');
if(!contract.includes('#77'))fail('Assignment Push contract must retain notification deferral.');
if(rootLegacy.includes("from './src/app/assignments.js'")||rootLegacy.includes('src/features/assignments'))fail('Retained root assignment-advanced.js must remain reference-only, not compose the v3 owner.');

for(const path of['scripts/validate-v3-assignment-push.mjs','tests/v3-assignment-push-edge.mjs','tests/v3-assignment-push-smoke.mjs'])if(!workflow.includes(path))fail(`Accumulated workflow must execute ${path}.`);

if(failures.length){console.error(`BibleQuest v3 Assignment Push validation FAILED (${failures.length})`);for(const message of failures)console.error(`- ${message}`);process.exit(1)}
console.log('BibleQuest v3 Assignment Push architecture validation passed.');
