import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {createAdminOperationsService}=await import(pathToFileURL(new URL('../src/app/admin-operations.js',import.meta.url).pathname));

const sessionState={authenticated:true,user:{id:'owner-1',email:'owner@example.test'}};
const calls=[];
const dashboard=()=>({
  ok:true,role:'owner',
  congregations:[{id:'c1',name:'First Church'}],
  online:[{congregation_id:'c1',congregation_name:'First Church',user_id:'u2',display_name:'Mina',role:'member',surface:'Reader',last_seen_at:'2026-09-11T00:00:00Z'}],
  assignments:[{id:'a1',congregation_id:'c1',congregation_name:'First Church',title:'Read John 1',creator_name:'Pastor A',creator_role:'pastor',assignment_type:'reading',active:true,started:3,completed:2,created_at:'2026-09-10T00:00:00Z',required_reflection:true,min_quiz_score:80}],
  messages:[{id:'m1',congregation_id:'c1',congregation_name:'First Church',title:'Sunday',creator_name:'Pastor A',creator_role:'pastor',message_type:'announcement',active:true,pinned:true,publish_at:'2026-09-11T00:00:00Z'}],
  polls:[{id:'p1',congregation_id:'c1',congregation_name:'First Church',prompt:'Meeting time?',creator_name:'Leader A',poll_type:'single',results_visibility:'live',active:true,votes:4,totals:[{label:'Morning',total:3},{label:'Evening',total:1}]}],
  media:[{id:'med1',congregation_id:'c1',congregation_name:'First Church',title:'Study',creator_name:'Owner',creator_role:'owner',media_type:'youtube_video',featured:true,display_order:1,active:true}],
  rooms:[{id:'r1',congregation_id:'c1',congregation_name:'First Church',title:'Live Study',creator_name:'Owner',status:'live',participants:5}],
  calendar:[{id:'cal1'}],recognitions:[{id:'rec1'}],
  health:{ops_version:5,checked_at:'2026-09-11T00:00:00Z',counts:{bible_assignments:9},client_errors_24h:[{id:'e1',user_id:'secret-user',congregation_id:'secret-congregation',surface:'Reader',message:'Sample error',app_version:'v3',created_at:'2026-09-11T00:00:00Z'}]}
});
const api={
  async status(){calls.push(['status']);return {ok:true,role:'owner',userId:'owner-1',opsVersion:5}},
  async dashboard(){calls.push(['dashboard']);return dashboard()},
  async frontendHealth(){calls.push(['frontendHealth']);return {pwa:'70',packPolicy:'3',runtimePolicy:'3',build:'abcdef1234567890'}},
  async deleteUser(targetUserId){calls.push(['deleteUser',targetUserId]);return {ok:true,deleted:true}},
  async suspendAccount(targetUserId,reason){calls.push(['suspendAccount',targetUserId,reason]);return {ok:true,active:false}},
  async reactivateAccount(targetUserId){calls.push(['reactivateAccount',targetUserId]);return {ok:true,active:true}},
  async forceSignOut(targetUserId){calls.push(['forceSignOut',targetUserId]);return {ok:true,revoked:true}},
  async setTempPassword(targetUserId,password){calls.push(['setTempPassword',targetUserId,password]);return {ok:true,revoked:true}},
  async changeEmail(targetUserId,email){calls.push(['changeEmail',targetUserId,email]);return {ok:true,changed:true,revoked:true}}
};
const session={getState:()=>sessionState};
const service=createAdminOperationsService({api,session});
let state=await service.refresh();
assert.equal(state.status,'ready');
assert.equal(state.role,'owner');
assert.equal(state.currentUserId,'owner-1');
assert.equal(state.dashboard.online[0].displayName,'Mina');
assert.equal(state.dashboard.assignments[0].minQuizScore,80);
assert.equal(state.dashboard.polls[0].totals[0].total,3);
assert.equal(state.dashboard.health.opsVersion,5);
assert.equal(state.frontend.pwa,'70');
assert.equal('userId' in state.dashboard.health.clientErrors24h[0],false,'Client error projection must not expose user identifiers.');
assert.equal('congregationId' in state.dashboard.health.clientErrors24h[0],false,'Client error projection must not expose congregation identifiers.');
await service.deleteUser('u2');
assert.deepEqual(calls.at(-1),['deleteUser','u2']);
await assert.rejects(()=>service.deleteUser('owner-1'),error=>error.code==='BQ_ADMIN_OPS_SELF_DELETE');
service.clear();
await assert.rejects(()=>service.deleteUser('u2'),error=>error.code==='BQ_ADMIN_OPS_NOT_READY');

const adminService=createAdminOperationsService({api:{...api,status:async()=>({role:'admin',userId:'admin-1'})},session:{getState:()=>({authenticated:true,user:{id:'admin-1'}})}});
state=await adminService.authorize();assert.equal(state.status,'ready');assert.equal(state.role,'admin');
await assert.rejects(()=>adminService.deleteUser('u2'),error=>error.code==='BQ_ADMIN_OPS_OWNER_REQUIRED');

let signedOutCalls=0;
const signedOutApi={status:async()=>{signedOutCalls++;return {role:'owner'}},dashboard:async()=>{signedOutCalls++;return {}},frontendHealth:async()=>{signedOutCalls++;return {}},deleteUser:async()=>{signedOutCalls++;return {deleted:true}},suspendAccount:async()=>{signedOutCalls++;return {active:false}},reactivateAccount:async()=>{signedOutCalls++;return {active:true}},forceSignOut:async()=>{signedOutCalls++;return {revoked:true}},setTempPassword:async()=>{signedOutCalls++;return {revoked:true}},changeEmail:async()=>{signedOutCalls++;return {changed:true}}};
state=await createAdminOperationsService({api:signedOutApi,session:{getState:()=>({authenticated:false,user:null})}}).refresh();
assert.equal(state.status,'signed-out');assert.equal(signedOutCalls,0,'Signed-out Admin Operations must not make privileged calls.');

let deniedDashboardCalls=0;
const deniedApi={...api,status:async()=>{throw new Error('Admin access required')},dashboard:async()=>{deniedDashboardCalls++;return {}}};
state=await createAdminOperationsService({api:deniedApi,session}).refresh();
assert.equal(state.status,'unauthorized');assert.equal(deniedDashboardCalls,0,'Dashboard must not load before authorization passes.');

const offlineApi={...api,status:async()=>{throw new Error('Network unavailable')}};
state=await createAdminOperationsService({api:offlineApi,session}).refresh();assert.equal(state.status,'error');

const frontendFailure={...api,frontendHealth:async()=>{throw new Error('Asset unavailable')}};
state=await createAdminOperationsService({api:frontendFailure,session}).refresh();assert.equal(state.status,'ready');assert.equal(state.frontend.pwa,'?','Frontend diagnostics failure must not hide authorized operational data.');

const unconfirmed={...api,deleteUser:async()=>({ok:true,deleted:false})};
const unconfirmedService=createAdminOperationsService({api:unconfirmed,session});await unconfirmedService.authorize();
await assert.rejects(()=>unconfirmedService.deleteUser('u2'),error=>error.code==='BQ_ADMIN_OPS_DELETE_UNCONFIRMED');

// --- Phase 2: emergency user-management actions ---
state=await service.refresh();assert.equal(state.status,'ready','Service must be re-authorized before Phase 2 assertions (a prior test left it cleared).');
await service.suspendAccount('u2','Reported harassment');
assert.deepEqual(calls.at(-1),['suspendAccount','u2','Reported harassment']);
await assert.rejects(()=>service.suspendAccount('owner-1'),error=>error.code==='BQ_ADMIN_OPS_SELF_SUSPEND','Owner must not be able to suspend their own account.');

await service.reactivateAccount('u2');
assert.deepEqual(calls.at(-1),['reactivateAccount','u2']);
await assert.rejects(()=>service.reactivateAccount('owner-1'),error=>error.code==='BQ_ADMIN_OPS_SELF_REACTIVATE');

await service.forceSignOut('u2');
assert.deepEqual(calls.at(-1),['forceSignOut','u2']);

await service.setTempPassword('u2','a-genuinely-long-temp-pw');
assert.deepEqual(calls.at(-1),['setTempPassword','u2','a-genuinely-long-temp-pw']);
await assert.rejects(()=>service.setTempPassword('u2','short'),error=>error.code==='BQ_ADMIN_OPS_PASSWORD_TOO_SHORT','Temporary passwords under 12 characters must be rejected client-side too, not just trusted to the server.');
await assert.rejects(()=>service.setTempPassword('owner-1','a-genuinely-long-temp-pw'),error=>error.code==='BQ_ADMIN_OPS_SELF_TEMP_PASSWORD','Owner must not be able to set a temporary password for themselves through the emergency tool.');
await assert.rejects(()=>adminService.setTempPassword('u2','a-genuinely-long-temp-pw'),error=>error.code==='BQ_ADMIN_OPS_OWNER_REQUIRED','Only the owner - not an admin - may set a temporary password.');

await service.changeEmail('u2',' New.Email@Example.test ');
assert.deepEqual(calls.at(-1),['changeEmail','u2','new.email@example.test']);
await assert.rejects(()=>service.changeEmail('owner-1','owner2@example.test'),error=>error.code==='BQ_ADMIN_OPS_SELF_EMAIL_CHANGE','Owner must not be able to change their own email through the emergency tool.');
await assert.rejects(()=>service.changeEmail('u2','not-an-email'),error=>error.code==='BQ_ADMIN_OPS_EMAIL_INVALID','Invalid recovery emails must be rejected client-side.');
await assert.rejects(()=>adminService.changeEmail('u2','member2@example.test'),error=>error.code==='BQ_ADMIN_OPS_OWNER_REQUIRED','Only the owner - not an admin - may change an account email.');

// Same busy-lock discipline as deleteUser must apply to every new action.
service.clear();
for(const [method,args] of [['suspendAccount',['u2']],['reactivateAccount',['u2']],['forceSignOut',['u2']],['setTempPassword',['u2','a-genuinely-long-temp-pw']],['changeEmail',['u2','member2@example.test']]]){
  await assert.rejects(()=>service[method](...args),error=>error.code==='BQ_ADMIN_OPS_NOT_READY',`${method} must require an authorized session.`);
}

console.log('v3 admin-operations edge: PASS');