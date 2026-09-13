import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssignmentsService } from '../src/app/assignments.js';

function membership(id,name){
  return Object.freeze({
    congregationId:id,
    userId:'user-1',
    role:'member',
    roleKnown:true,
    roleLabel:'Member',
    congregation:Object.freeze({id,name,timezone:'Asia/Tokyo',ownerId:'owner-1'})
  });
}

function harness(){
  const memberships=[membership('cong-a','Alpha'),membership('cong-b','Beta')];
  let activeId='cong-a';
  let userId='user-1';
  const loads=[];
  const assertions=[];
  const session={
    getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})
  };
  const congregation={
    load:async()=>memberships,
    getActive:()=>memberships.find(row=>row.congregationId===activeId)||null,
    setActive:id=>{activeId=id;return congregation.getActive()},
    assert:(id,capability)=>{
      assertions.push([id,capability]);
      if(!memberships.some(row=>row.congregationId===id))throw new Error('not a member');
      return true;
    }
  };
  const api={
    load:async(congregationId,loadedUserId)=>{loads.push([congregationId,loadedUserId]);return {assignments:[],progress:[]}},
    start:async()=>({progress:{assignment_id:'x',user_id:userId,status:'started'},awarded:0}),
    complete:async()=>({progress:{assignment_id:'x',user_id:userId,status:'completed'},awarded:0}),
    subscribe:async()=>()=>{}
  };
  return {
    service:createAssignmentsService({api,session,congregation}),
    congregation,
    loads,
    assertions,
    setUser:id=>{userId=id}
  };
}

test('default Assignments load follows integrated active congregation after switching',async()=>{
  const h=harness();
  let state=await h.service.load();
  assert.equal(state.congregationId,'cong-a');
  assert.deepEqual(h.loads.at(-1),['cong-a','user-1']);

  h.congregation.setActive('cong-b');
  state=await h.service.load();
  assert.equal(state.congregationId,'cong-b');
  assert.equal(state.congregationName,'Beta');
  assert.deepEqual(h.loads.at(-1),['cong-b','user-1']);
  assert.deepEqual(h.assertions.at(-1),['cong-b','read']);
});

test('explicit congregation context remains stable for in-flight Assignments operations',async()=>{
  const h=harness();
  await h.service.load();
  h.congregation.setActive('cong-b');
  const state=await h.service.load({congregationId:'cong-a'});
  assert.equal(state.congregationId,'cong-a');
  assert.deepEqual(h.loads.at(-1),['cong-a','user-1']);
});

test('active congregation takes precedence over stale Assignments service state',async()=>{
  const h=harness();
  await h.service.load({congregationId:'cong-a'});
  h.congregation.setActive('cong-b');
  const state=await h.service.load();
  assert.equal(state.congregationId,'cong-b');
});

test('non-member active values cannot escape membership-scoped fallback',async()=>{
  const h=harness();
  await h.service.load();
  h.congregation.setActive('not-a-membership');
  const state=await h.service.load();
  assert.equal(state.congregationId,'cong-a');
  assert.deepEqual(h.loads.at(-1),['cong-a','user-1']);
});
