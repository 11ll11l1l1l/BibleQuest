import test from 'node:test';
import assert from 'node:assert/strict';
import { assignmentPreparationPage, renderAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-page.js';
import { V7_ASSIGNMENT_KEY_INVENTORY } from '../../src/content/locales/v7-assignment.js';

const pair={id:'pair-1',mentorId:'mentor-1',menteeId:'mentee-1',state:'active'};
const lesson={id:'lesson-1',revisionId:'lesson-r1',title:'<Assurance>',position:0};
const moduleRow={id:'module-1',revisionId:'module-r1',title:'Start',position:0,lessons:[lesson]};
const track={id:'track-1',revisionId:'track-r1',title:'Foundations',position:0,modules:[moduleRow]};
const base=()=>({status:'ready',pairs:[pair],curriculum:[track],selected:{pairId:'pair-1',trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1'},error:null});
const request={pairId:'pair-1',trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'lesson-r1'};

function harness(preparationOverrides={}){
  let listener;const calls=[];
  const preparation={
    getState:()=>base(),subscribe(fn){listener=fn;return()=>{listener=null;};},async loadPairs(){},
    async selectPair(id){calls.push(['pair',id]);},async selectTrack(id){calls.push(['track',id]);},async selectModule(id){calls.push(['module',id]);},async selectLesson(id){calls.push(['lesson',id]);},
    buildRequest(){calls.push(['build']);return request;},invalidate(){calls.push(['invalidate']);},dispose(){calls.push(['dispose']);},
    ...preparationOverrides,
  };
  const host={innerHTML:''};const handlers=new Map();
  const root={querySelector:()=>host,addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
  return {preparation,host,handlers,root,calls,get listener(){return listener;}};
}

function clickAction(handlers,action){
  handlers.get('click')({target:{disabled:false,closest(){return this;},getAttribute(name){if(name==='data-assignment-action')return action;return null;}}});
}

const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('renders a localized read-only mentor preparation surface when no assignment authority is supplied',()=>{
  const html=renderAssignmentPreparation(base());
  assert.match(html,/Prepare a lesson assignment/);
  assert.match(html,/Prepare assignment request/);
  assert.match(html,/does not create an assignment/);
  assert.match(html,/&lt;Assurance&gt;/);
  assert.doesNotMatch(html,/<Assurance>/);
  assert.doesNotMatch(html,/data-assignment-action="create"|data-assignment-action="start"/);
});

test('renders create only when a real assignment authority is supplied',()=>{
  const html=renderAssignmentPreparation(base(),{canCreate:true});
  assert.match(html,/data-assignment-action="create"/);
  assert.match(html,/>Create assignment</);
  assert.doesNotMatch(html,/does not create an assignment/);
  assert.doesNotMatch(html,/data-assignment-action="prepare"/);
});

test('incomplete path cannot emit prepare or create actions',()=>{
  const state=base();state.selected={pairId:'pair-1',trackId:null,moduleId:null,lessonId:null};
  for(const canCreate of [false,true]){
    const html=renderAssignmentPreparation(state,{canCreate});
    assert.match(html,/Choose a mentee, track, module, and lesson/);
    assert.doesNotMatch(html,/data-assignment-action="prepare"|data-assignment-action="create"/);
  }
});

test('visible assignment strings are registered for approved English fallback',()=>{
  for(const key of ['v7.assignment.title','v7.assignment.prepare','v7.assignment.create','v7.assignment.creating','v7.assignment.created','v7.assignment.backendPending','v7.assignment.contextChanged']){
    assert.equal(V7_ASSIGNMENT_KEY_INVENTORY.includes(key),true,key);
  }
  const html=renderAssignmentPreparation(base(),{translate:key=>`[${key}]`});
  assert.match(html,/\[v7\.assignment\.title\]/);
  assert.doesNotMatch(html,/>Prepare a lesson assignment</);
});

test('backend error details are redacted from the rendered page',()=>{
  const state=base();state.error='<database secret>';
  const html=renderAssignmentPreparation(state);
  assert.match(html,/Assignment preparation could not complete this action/);
  assert.doesNotMatch(html,/database secret/);
});

test('preparation-only mode still emits exactly the frozen request through the supplied callback',async()=>{
  const h=harness();const prepared=[];
  const page=assignmentPreparationPage({preparation:h.preparation,onPrepared:value=>prepared.push(value)});const cleanup=page.mount(h.root);
  await tick();clickAction(h.handlers,'prepare');await tick();
  assert.deepEqual(prepared,[request]);assert.deepEqual(h.calls.filter(row=>row[0]==='build'),[['build']]);
  cleanup();assert.equal(h.listener,null);assert.equal(h.handlers.size,0);
});

test('authority mode creates the exact prepared request and only displays a matching stable acknowledgement',async()=>{
  const h=harness(),authorityCalls=[],created=[];
  const createAssignment=async value=>{authorityCalls.push(value);return {id:'assignment-1',status:'assigned',...value};};
  const page=assignmentPreparationPage({preparation:h.preparation,createAssignment,onCreated:value=>created.push(value)});const cleanup=page.mount(h.root);
  await tick();clickAction(h.handlers,'create');await tick();await tick();
  assert.deepEqual(authorityCalls,[request]);
  assert.equal(created.length,1);assert.equal(created[0].id,'assignment-1');assert.equal(created[0].status,'assigned');
  assert.match(h.host.innerHTML,/Assignment created\. Status: assigned\./);
  assert.deepEqual(h.calls.filter(row=>row[0]==='build'),[['build']]);
  cleanup();
});

test('false-success assignment acknowledgement is rejected and never displayed',async()=>{
  const h=harness(),created=[];
  const page=assignmentPreparationPage({preparation:h.preparation,
    createAssignment:async value=>({id:'assignment-1',status:'assigned',...value,lessonRevisionId:'foreign-r9'}),
    onCreated:value=>created.push(value)});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'create');await tick();await tick();
  assert.deepEqual(created,[]);assert.match(h.host.innerHTML,/Assignment preparation could not complete this action/);
  assert.doesNotMatch(h.host.innerHTML,/Assignment created/);cleanup();
});

test('duplicate create clicks are suppressed while the authority call is active',async()=>{
  const h=harness();let resolveAuthority,calls=0;
  const pending=new Promise(resolve=>{resolveAuthority=resolve;});
  const page=assignmentPreparationPage({preparation:h.preparation,createAssignment:async value=>{calls+=1;await pending;return{id:'assignment-1',status:'assigned',...value};}});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'create');clickAction(h.handlers,'create');await tick();
  assert.equal(calls,1);assert.match(h.host.innerHTML,/Creating assignment/);
  resolveAuthority();await tick();await tick();assert.match(h.host.innerHTML,/Assignment created/);cleanup();
});

test('a post-success navigation callback failure cannot turn confirmed backend success into failure',async()=>{
  const h=harness();
  const page=assignmentPreparationPage({preparation:h.preparation,
    createAssignment:async value=>({id:'assignment-1',status:'assigned',...value}),
    onCreated:async()=>{throw new Error('route unavailable');}});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'create');await tick();await tick();
  assert.match(h.host.innerHTML,/Assignment created\. Status: assigned\./);
  assert.doesNotMatch(h.host.innerHTML,/could not complete/);cleanup();
});

test('context changes invalidate feature state and suppress a late creation acknowledgement',async()=>{
  const h=harness();let contextListener,resolveAuthority;
  const pending=new Promise(resolve=>{resolveAuthority=resolve;});
  const page=assignmentPreparationPage({preparation:h.preparation,
    createAssignment:async value=>{await pending;return{id:'assignment-1',status:'assigned',...value};},
    subscribeContext(fn){contextListener=fn;return()=>{contextListener=null;};}});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'create');await tick();contextListener();
  assert.match(h.host.innerHTML,/Account or congregation changed/);
  resolveAuthority();await tick();await tick();assert.doesNotMatch(h.host.innerHTML,/Assignment created/);
  assert.deepEqual(h.calls.filter(row=>row[0]==='invalidate'),[['invalidate']]);
  cleanup();assert.equal(contextListener,null);
});


test('stale reload and selection clicks cannot strand an in-flight assignment creation',async()=>{
  const h=harness();let resolveAuthority,reloads=0;
  h.preparation.loadPairs=async()=>{reloads+=1;};
  const pending=new Promise(resolve=>{resolveAuthority=resolve;});
  const page=assignmentPreparationPage({preparation:h.preparation,createAssignment:async value=>{await pending;return {id:'assignment-1',status:'assigned',...value};}});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'create');await tick();
  clickAction(h.handlers,'reload');
  h.handlers.get('click')({target:{disabled:false,closest(){return this;},getAttribute(name){return name==='data-assignment-select'?'pair':name==='data-id'?'pair-2':null;}}});
  await tick();assert.equal(reloads,1);assert.equal(h.calls.filter(row=>row[0]==='pair').length,0);
  resolveAuthority();await tick();await tick();assert.match(h.host.innerHTML,/Assignment created/);
  assert.doesNotMatch(h.host.innerHTML,/Creating assignment/);cleanup();
});

test('stale creation clicks cannot dispatch while preparation is loading or failed',async()=>{
  let state=base(),created=0;
  const h=harness({getState:()=>state});
  const page=assignmentPreparationPage({preparation:h.preparation,createAssignment:async value=>{created+=1;return {id:'assignment-1',status:'assigned',...value};}});
  const cleanup=page.mount(h.root);await tick();
  for(const status of ['loading','error','idle']){state={...base(),status};clickAction(h.handlers,'create');await tick();}
  assert.equal(created,0);cleanup();
});

test('context change remains authoritative when an older preparation callback rejects late',async()=>{
  const h=harness();let contextListener,rejectPrepared;
  const pending=new Promise((resolve,reject)=>{rejectPrepared=reject;});
  const page=assignmentPreparationPage({preparation:h.preparation,
    onPrepared:async()=>pending,
    subscribeContext(fn){contextListener=fn;return()=>{contextListener=null;};}});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'prepare');await tick();contextListener();
  assert.match(h.host.innerHTML,/Account or congregation changed/);
  rejectPrepared(new Error('stale preparation failure'));await tick();await tick();
  assert.match(h.host.innerHTML,/Account or congregation changed/);
  assert.doesNotMatch(h.host.innerHTML,/could not complete this action/);
  cleanup();
});

test('a newer preparation action suppresses an older callback failure',async()=>{
  const h=harness();let rejectFirst,calls=0;
  const first=new Promise((resolve,reject)=>{rejectFirst=reject;});
  const page=assignmentPreparationPage({preparation:h.preparation,onPrepared:async()=>{calls+=1;if(calls===1)return first;}});
  const cleanup=page.mount(h.root);await tick();clickAction(h.handlers,'prepare');await tick();clickAction(h.handlers,'prepare');await tick();
  assert.equal(calls,2);
  rejectFirst(new Error('superseded preparation failure'));await tick();await tick();
  assert.doesNotMatch(h.host.innerHTML,/could not complete this action/);
  cleanup();
});
