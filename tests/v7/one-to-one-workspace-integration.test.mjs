import test from 'node:test';
import assert from 'node:assert/strict';
import { createV7WorkspacePage, v7AuthoringContext } from '../../src/app/v7-workspace.js';

const ids=Object.freeze({
  user:'11111111-1111-1111-1111-111111111111',
  congregation:'22222222-2222-2222-2222-222222222222',
  otherCongregation:'33333333-3333-3333-3333-333333333333',
  pair:'44444444-4444-4444-4444-444444444444',
  mentee:'55555555-5555-5555-5555-555555555555',
  track:'66666666-6666-6666-6666-666666666666',
  module:'77777777-7777-7777-7777-777777777777',
  lesson:'88888888-8888-8888-8888-888888888888',
  revision:'99999999-9999-9999-9999-999999999999',
  assignment:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
});

const pair=Object.freeze({id:ids.pair,mentorId:ids.user,menteeId:ids.mentee,state:'active'});
const curriculum=Object.freeze([Object.freeze({
  id:ids.track,title:'Foundations',position:0,modules:Object.freeze([Object.freeze({
    id:ids.module,title:'Start',position:0,lessons:Object.freeze([Object.freeze({
      id:ids.lesson,revisionId:ids.revision,title:'Assurance',position:0,
    })]),
  })]),
})]);
const expectedRpcArgs=Object.freeze({
  p_pair_id:ids.pair,
  p_track_id:ids.track,
  p_module_id:ids.module,
  p_lesson_id:ids.lesson,
  p_lesson_revision_id:ids.revision,
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function createContext(){
  let active={userId:ids.user,congregationId:ids.congregation,role:'leader'};
  const session={getState:()=>({authenticated:true,user:{id:ids.user}})};
  const membership={getActive:()=>active};
  return {session,membership,setActive:value=>{active=value;}};
}

function createService(){
  return {
    async listPairs(){return [pair];},
    async loadAssignableCurriculum(pairId){assert.equal(pairId,ids.pair);return curriculum;},
  };
}

function createRoot(){
  const host={innerHTML:''};
  const handlers=new Map();
  const root={
    querySelector(){return host;},
    addEventListener(name,handler){handlers.set(name,handler);},
    removeEventListener(name){handlers.delete(name);},
  };
  return {root,host,handlers};
}

function click(handlers,attributes){
  const handler=handlers.get('click');
  assert.equal(typeof handler,'function');
  handler({target:{
    disabled:false,
    closest(){return this;},
    getAttribute(name){return attributes[name]??null;},
  }});
}

async function chooseAssignmentPath(handlers){
  click(handlers,{'data-assignment-select':'pair','data-id':ids.pair});await tick();
  click(handlers,{'data-assignment-select':'track','data-id':ids.track});await tick();
  click(handlers,{'data-assignment-select':'module','data-id':ids.module});await tick();
  click(handlers,{'data-assignment-select':'lesson','data-id':ids.lesson});await tick();
}

test('workspace authoring context is scoped to the active account and author role',()=>{
  const session={getState:()=>({authenticated:true,user:{id:ids.user}})};
  let active={userId:ids.user,congregationId:ids.congregation,role:'leader'};
  const membership={getActive:()=>active};

  assert.deepEqual(v7AuthoringContext(session,membership),{
    userId:ids.user,congregationId:ids.congregation,canAuthor:true,
  });

  active={...active,role:'member'};
  assert.deepEqual(v7AuthoringContext(session,membership),{
    userId:ids.user,congregationId:ids.congregation,canAuthor:false,
  });

  active={userId:ids.mentee,congregationId:ids.congregation,role:'leader'};
  assert.deepEqual(v7AuthoringContext(session,membership),{
    userId:null,congregationId:null,canAuthor:false,
  });
});

test('assignment workspace composes preparation and authority into the exact ONE 2 ONE RPC',async()=>{
  const {session,membership}=createContext();
  const calls=[];
  const db={async rpc(name,args){calls.push({name,args});return {data:[{assignment_id:ids.assignment,assignment_status:'assigned'}],error:null};}};
  const {root,host,handlers}=createRoot();
  let contextListener=null;
  const page=createV7WorkspacePage({
    view:'assignment',
    client:async()=>db,
    session,
    membership,
    service:createService(),
    subscribeContext(listener){contextListener=listener;return()=>{contextListener=null;};},
  });
  const cleanup=page.mount(root);
  await tick();
  await chooseAssignmentPath(handlers);
  click(handlers,{'data-assignment-action':'create'});
  await tick();await tick();

  assert.deepEqual(calls,[{name:'bible_v7_create_pair_assignment',args:expectedRpcArgs}]);
  assert.match(host.innerHTML,/Assignment created\. Status: assigned\./);

  cleanup();
  assert.equal(contextListener,null);
  assert.equal(handlers.size,0);
});

test('assignment workspace rejects an in-flight success after the active congregation changes',async()=>{
  const {session,membership,setActive}=createContext();
  const calls=[];
  let resolveRpc;
  const pending=new Promise(resolve=>{resolveRpc=resolve;});
  const db={async rpc(name,args){calls.push({name,args});await pending;return {data:[{assignment_id:ids.assignment,assignment_status:'assigned'}],error:null};}};
  const {root,host,handlers}=createRoot();
  let contextListener=null;
  const page=createV7WorkspacePage({
    view:'assignment',
    client:async()=>db,
    session,
    membership,
    service:createService(),
    subscribeContext(listener){contextListener=listener;return()=>{contextListener=null;};},
  });
  const cleanup=page.mount(root);
  await tick();
  await chooseAssignmentPath(handlers);
  click(handlers,{'data-assignment-action':'create'});
  await tick();
  assert.deepEqual(calls,[{name:'bible_v7_create_pair_assignment',args:expectedRpcArgs}]);

  setActive({userId:ids.user,congregationId:ids.otherCongregation,role:'leader'});
  contextListener();
  assert.match(host.innerHTML,/Account or congregation changed/);
  assert.doesNotMatch(host.innerHTML,/Assignment created/);

  resolveRpc();
  await tick();await tick();
  assert.match(host.innerHTML,/Account or congregation changed/);
  assert.doesNotMatch(host.innerHTML,/Assignment created/);
  assert.equal(calls.length,1);

  cleanup();
  assert.equal(contextListener,null);
});
