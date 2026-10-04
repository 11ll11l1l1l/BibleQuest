import test from 'node:test';
import assert from 'node:assert/strict';
import { assignmentPreparationPage, renderAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-page.js';
import { V7_ASSIGNMENT_KEY_INVENTORY } from '../../src/content/locales/v7-assignment.js';

const pair={id:'pair-1',mentorId:'mentor-1',menteeId:'mentee-1',state:'active'};
const lesson={id:'lesson-1',revisionId:'lesson-r1',title:'<Assurance>',position:0};
const moduleRow={id:'module-1',revisionId:'module-r1',title:'Start',position:0,lessons:[lesson]};
const track={id:'track-1',revisionId:'track-r1',title:'Foundations',position:0,modules:[moduleRow]};
const base=()=>({status:'ready',pairs:[pair],curriculum:[track],selected:{pairId:'pair-1',trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1'},error:null});

test('renders a localized read-only mentor preparation surface without assignment mutation',()=>{
  const html=renderAssignmentPreparation(base());
  assert.match(html,/Prepare a lesson assignment/);
  assert.match(html,/Prepare assignment request/);
  assert.match(html,/does not create an assignment/);
  assert.match(html,/&lt;Assurance&gt;/);
  assert.doesNotMatch(html,/<Assurance>/);
  assert.doesNotMatch(html,/data-assignment-action="create"|data-assignment-action="start"/);
});

test('incomplete path cannot emit the prepare action',()=>{
  const state=base();state.selected={pairId:'pair-1',trackId:null,moduleId:null,lessonId:null};
  const html=renderAssignmentPreparation(state);
  assert.match(html,/Choose a mentee, track, module, and lesson/);
  assert.doesNotMatch(html,/data-assignment-action="prepare"/);
});

test('visible assignment strings are registered for approved English fallback',()=>{
  for(const key of ['v7.assignment.title','v7.assignment.prepare','v7.assignment.backendPending','v7.assignment.contextChanged']){
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

test('page emits only the exact prepared request through the supplied callback',async()=>{
  let listener;const calls=[];const request={pairId:'pair-1',trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'lesson-r1'};
  const preparation={
    getState:()=>base(),subscribe(fn){listener=fn;return()=>{listener=null;};},async loadPairs(){},
    async selectPair(id){calls.push(['pair',id]);},selectTrack(id){calls.push(['track',id]);},selectModule(id){calls.push(['module',id]);},selectLesson(id){calls.push(['lesson',id]);},
    buildRequest(){calls.push(['build']);return request;},invalidate(){},dispose(){calls.push(['dispose']);},
  };
  const host={innerHTML:''};const handlers=new Map();
  const root={querySelector:()=>host,addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
  const prepared=[];const page=assignmentPreparationPage({preparation,onPrepared:value=>prepared.push(value)});const cleanup=page.mount(root);
  await new Promise(resolve=>setImmediate(resolve));
  handlers.get('click')({target:{closest(){return this;},getAttribute(name){if(name==='data-assignment-action')return 'prepare';return null;}}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(prepared,[request]);assert.deepEqual(calls.filter(row=>row[0]==='build'),[['build']]);
  assert.equal('createAssignment' in preparation,false);cleanup();assert.equal(listener,null);assert.equal(handlers.size,0);
});

test('context changes invalidate the feature-local state and display a safe message',async()=>{
  let listener,contextListener,invalidated=false,disposed=false;const state=base();
  const preparation={getState:()=>state,subscribe(fn){listener=fn;return()=>{listener=null;};},async loadPairs(){},buildRequest(){return{};},invalidate(){invalidated=true;},dispose(){disposed=true;}};
  const host={innerHTML:''};const root={querySelector:()=>host,addEventListener(){},removeEventListener(){}};
  const page=assignmentPreparationPage({preparation,subscribeContext(fn){contextListener=fn;return()=>{contextListener=null;};}});const cleanup=page.mount(root);
  await new Promise(resolve=>setImmediate(resolve));contextListener();
  assert.equal(invalidated,true);assert.match(host.innerHTML,/Account or congregation changed/);
  cleanup();assert.equal(disposed,true);assert.equal(contextListener,null);void listener;
});
