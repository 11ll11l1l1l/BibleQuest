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
  async deleteUser(targetUserId){calls.push(['deleteUser',targetUserId]);return {ok:true,deleted:true}}
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
const signedOutApi={status:async()=>{signedOutCalls++;return {role:'owner'}},dashboard:async()=>{signedOutCalls++;return {}},frontendHealth:async()=>{signedOutCalls++;return {}},deleteUser:async()=>{signedOutCalls++;return {deleted:true}}};
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

console.log('v3 admin-operations edge: PASS');