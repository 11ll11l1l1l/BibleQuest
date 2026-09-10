import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {createAdminConsoleService}=await import(pathToFileURL(new URL('../src/app/admin-console.js',import.meta.url).pathname));
const user={id:'u-admin',email:'admin@example.test'};
const sessionState={authenticated:true,user};
const calls=[];
const api={
  status:async()=>({role:'admin'}),
  listUsers:async()=>({role:'admin',users:[{id:'u1',email:'one@example.test',name:'One',role:'member',memberships:[{congregationId:'c1',congregationName:'ICAC',role:'member',active:true}],groupMemberships:[]}],options:{congregations:[{id:'c1',name:'ICAC',ownerId:'owner'}],groups:[]}}),
  setRole:async(...args)=>{calls.push(['setRole',...args]);return {ok:true}},
  setCongregation:async(...args)=>{calls.push(['setCongregation',...args]);return {ok:true}},
  removeCongregation:async(...args)=>{calls.push(['removeCongregation',...args]);return {ok:true}},
  setCongregationRole:async(...args)=>{calls.push(['setCongregationRole',...args]);return {ok:true}},
  createCongregation:async(...args)=>{calls.push(['createCongregation',...args]);return {ok:true,inviteCode:'ABC123'}},
  createSmallGroup:async(...args)=>{calls.push(['createSmallGroup',...args]);return {ok:true,inviteCode:'GRP123'}},
  setGroupMembership:async(...args)=>{calls.push(['setGroupMembership',...args]);return {ok:true}},
  setGroupOwner:async(...args)=>{calls.push(['setGroupOwner',...args]);return {ok:true}}
};
const session={getState:()=>sessionState};
const service=createAdminConsoleService({api,session});
let state=await service.refresh();
assert.equal(state.status,'ready');assert.equal(state.role,'admin');assert.equal(state.users.length,1);assert.equal(state.options.congregations[0].name,'ICAC');
await service.setRole('u1','member');assert.deepEqual(calls.at(-1),['setRole','u1','member']);assert.equal(service.getState().status,'ready');
await service.setCongregationRole('u1','c1','pastor');assert.deepEqual(calls.at(-1),['setCongregationRole','u1','c1','pastor']);
await service.createSmallGroup({congregationId:'c1',name:'Family',maxMembers:99});assert.deepEqual(calls.at(-1),['createSmallGroup',{congregationId:'c1',name:'Family',maxMembers:6}]);
await service.setGroupMembership({targetUserId:'u1',groupId:'g1',role:'leader'});assert.deepEqual(calls.at(-1),['setGroupMembership',{targetUserId:'u1',groupId:'g1',role:'leader',active:true}]);
assert.throws(()=>service.setRole('','admin'),/valid member/i);
sessionState.authenticated=false;state=await service.refresh();assert.equal(state.status,'signed-out');
sessionState.authenticated=true;
const deniedApi={...api,status:async()=>{throw new Error('BibleQuest admin access required')}};
state=await createAdminConsoleService({api:deniedApi,session}).refresh();assert.equal(state.status,'unauthorized');
const offlineApi={...api,status:async()=>{throw new Error('Network unavailable')}};
state=await createAdminConsoleService({api:offlineApi,session}).refresh();assert.equal(state.status,'error');
const guest=createAdminConsoleService({api,session:{getState:()=>({authenticated:false,user:null})}});await guest.refresh();await assert.rejects(()=>guest.setRole('u1','member'),error=>error.code==='BQ_ADMIN_NOT_READY');
console.log('v3 admin-console edge: PASS');
