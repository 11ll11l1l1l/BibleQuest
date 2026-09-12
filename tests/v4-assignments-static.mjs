// BibleQuest V4 Assignments page acceptance contract.
// Presentation may evolve. Section I also permits narrowly scoped security/privacy
// hardening inside the existing Assignments service owner, while linked-activity
// ownership and the trusted server boundary remain byte-exact.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='2acdad0d0bf572e2b1bd22b414ef55655521ffdd';
for(const relative of[
  'src/app/linked-activities.js',
  'supabase/functions/bq-assignment/index.ts'
]){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged during V4 Assignments acceptance.`);
}

const service=fs.readFileSync(path.join(root,'src/app/assignments.js'),'utf8');
const requiredServiceContracts=[
  "export const assignmentsContract=Object.freeze({types:ASSIGNMENT_TYPES.slice(),targetScopes:TARGET_SCOPES.slice(),progressStates:PROGRESS_STATES.slice(),evidenceTypes:EVIDENCE_TYPES.slice(),ministryRoles:[...MINISTRY_ROLES],submissionMax:4000,recurrenceGeneration:false,linkedPublishing:false,responsePrivacy:'peer-presence-only'})",
  'export function createAssignmentsService({api,session,congregation,now=()=>new Date()})',
  "if(rowUser!==String(userId)||!visibleIds.has(assignmentId))return null",
  "if(!row||String(row.assignment_id||'')!==String(assignmentId)||String(row.user_id||'')!==String(userId))",
  "congregation.assert(state.congregationId,'ministry')",
  'resetAccountState',
  "userId:String(userId||'')",
  'state.userId===currentUserId',
  "String(current?.user?.id||'')!==userId",
  "return Object.freeze({load,loadPublishTargets,publish,open,loadReview,close,start,complete,watch,stopSync,snapshot,clear,contract:assignmentsContract})"
];
for(const token of requiredServiceContracts)assert.ok(service.includes(token),`Assignments service must retain contract: ${token}`);
assert.ok(!/\bfetch\s*\(/.test(service),'Assignments service must continue using the shared API owner rather than direct fetch().');
assert.ok(!/supabase\.co|service[_-]?role|sb_secret_/i.test(service),'Assignments service must not bypass the shared API/RLS boundary or contain privileged credentials.');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src/ui/ministry-ops-v4.css'),'utf8');
const feature=fs.readFileSync(path.join(root,'src/features/assignments/index.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/v3-regression.yml'),'utf8');

assert.ok(html.includes('src/ui/ministry-ops-v4.css'),'V4 Assignments stylesheet must remain active.');
for(const selector of[
  '[data-assignments-view]',
  '[data-assignment-detail]',
  '[data-assignment-response-review]',
  '[data-assignment-private-responses]',
  '[data-assignment-publisher]'
]) assert.ok(css.includes(selector),`V4 Assignments presentation must cover ${selector}.`);
assert.ok(css.includes('@media(max-width:720px)')&&css.includes('@media(max-width:390px)'),'V4 Assignments must retain phone composition rules including the 390px target.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'V4 Assignments must retain reduced-motion presentation.');
assert.ok(css.includes('@media(prefers-contrast:more)'),'V4 Assignments must retain stronger-contrast presentation.');
assert.ok(css.includes('min-height:var(--tap-target)'),'V4 Assignments actions must retain shared touch-target sizing.');
assert.ok(!/https?:\/\//.test(css),'V4 Assignments presentation must not introduce remote assets.');

for(const token of[
  "state.status==='signed-out'",
  "state.status==='local-preview'",
  "state.status==='no-congregation'",
  'Loading assignments…',
  'No active assignments',
  'data-assignment-open',
  'data-assignment-start',
  'data-assignment-complete',
  'data-assignment-publisher',
  'data-assignment-review-refresh',
  'Privacy boundary'
]) assert.ok(feature.includes(token),`Assignments page must retain ${token}.`);

assert.ok(feature.includes('safeAssignmentErrorCodes')&&feature.includes('safeAssignmentMessage'),'Assignments page must sanitize caught errors at the presentation boundary.');
assert.ok(feature.includes("BQ_ASSIGNMENT_PUBLISH_INPUT")&&feature.includes("BQ_ASSIGNMENT_REFLECTION_REQUIRED")&&feature.includes("BQ_CONGREGATION_PERMISSION_DENIED"),'Known user-action validation errors must remain intentionally allowlisted.');
assert.ok(!feature.includes('message=error?.message'),'Assignments action handlers must not display arbitrary thrown error messages.');
assert.ok(!feature.includes('esc(error?.message'),'Assignments load failure must not display arbitrary thrown error messages.');
assert.ok(!feature.includes('esc(review.error'),'Assignments response-review failure must not display arbitrary service error details.');
assert.ok(feature.includes('Assignments could not load.')&&feature.includes('Response status could not load.')&&feature.includes('Audience directory could not load.')&&feature.includes('Assignment could not be published.')&&feature.includes('Task could not be completed.'),'Assignments must provide bounded generic failure messages.');

assert.ok(feature.includes('You cannot see whether other members have responded, their names, or their answers.'),'Self-only response privacy boundary (Phase 1) must remain explicit for members.');
assert.ok(feature.includes('is private to authorized ministry roles')||feature.includes('visible only to authorized ministry roles'),'Ministry-only answer visibility must remain explicit.');
assert.ok(feature.includes('Private study notes and other personal BibleQuest data stay outside Assignments.'),'Private study data boundary must remain explicit.');

assert.ok(workflow.includes('tests/v4-assignments-static.mjs'),'Accumulated edge CI must run the V4 Assignments static acceptance contract.');
assert.ok(workflow.includes('tests/v4-assignments-page-smoke.mjs'),'Accumulated browser CI must run the V4 Assignments page acceptance smoke.');
for(const retained of[
  'tests/v3-assignments-edge.mjs',
  'tests/v3-assignment-response-auth-edge.mjs',
  'tests/v3-assignments-smoke.mjs',
  'tests/v3-advanced-assignments-smoke.mjs'
]) assert.ok(workflow.includes(retained),`Accumulated CI must retain ${retained}.`);

console.log('BibleQuest v4 Assignments page static acceptance contract passed.');