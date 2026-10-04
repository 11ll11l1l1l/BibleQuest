import test from 'node:test';
import assert from 'node:assert/strict';
import {curriculumAuthoringPage,renderCurriculumAuthoring} from '../../src/features/curriculum-authoring/index.js';

const base=()=>({status:'ready',tracks:[],modules:[],lessons:[],revisions:[],steps:[],selected:{trackId:null,moduleId:null,lessonId:null,revisionId:null},readiness:null,error:null});

test('authoring render escapes dynamic content and exposes no client publish mutation',()=>{
  const state=base();state.tracks=[{id:'track-1',title:'<img src=x onerror=bad>',summary:'',locale:'en',audience:'',position:0,publicationState:'draft'}];state.selected.trackId='track-1';
  state.modules=[{id:'module-1',title:'Start',summary:'',position:0,publicationState:'draft'}];state.selected.moduleId='module-1';
  state.lessons=[{id:'lesson-1',title:'Assurance',position:0,publicationState:'draft'}];state.selected.lessonId='lesson-1';
  state.revisions=[{id:'revision-1',revisionNumber:1,summary:'',locale:'en'}];state.selected.revisionId='revision-1';
  state.steps=[{id:'step-1',position:0,stepType:'scripture'}];state.readiness={ready:true,stepCount:7,blockers:[],request:{lessonRevisionId:'revision-1'}};
  const html=renderCurriculumAuthoring(state);
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
  assert.match(html,/Scripture/);assert.match(html,/Action/);assert.match(html,/Ready for atomic publication/);
  assert.doesNotMatch(html,/data-authoring-action="publish"|>Publish</);
  assert.match(html,/data-authoring-form="track-update"/);assert.match(html,/data-authoring-form="step-save"/);
});

test('incomplete readiness renders blockers without implying publication success',()=>{
  const state=base();state.readiness={ready:false,stepCount:5,blockers:['seven_steps_incomplete','lesson_not_draft'],request:null};
  const html=renderCurriculumAuthoring(state);
  assert.match(html,/5\/7 steps complete/);assert.match(html,/seven steps incomplete/);assert.match(html,/lesson not draft/);
  assert.doesNotMatch(html,/Ready for atomic publication/);
});

test('busy authoring disables reload/readiness controls',()=>{
  const state=base();state.status='saving';state.selected.revisionId='revision-1';
  const html=renderCurriculumAuthoring(state);
  assert.match(html,/data-authoring-action="reload" disabled/);assert.match(html,/data-authoring-action="readiness" disabled/);assert.match(html,/saving…/);
});

test('page lifecycle loads, invalidates on context change and disposes cleanly',async()=>{
  let state=base(),listener,contextListener,disposed=false,invalidated=false,loaded=0;
  const controller={
    getState:()=>state,subscribe(fn){listener=fn;return()=>{listener=null;};},
    async load(){loaded++;state={...base(),tracks:[{id:'t',title:'Loaded',position:0,publicationState:'draft'}]};listener?.(state);},
    invalidate(){invalidated=true;state=base();listener?.(state);},dispose(){disposed=true;},
  };
  const host={innerHTML:''};const handlers=new Map();
  const root={querySelector(selector){return selector==='[data-curriculum-authoring]'?host:null;},addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
  const page=curriculumAuthoringPage({controller,subscribeContext(fn){contextListener=fn;return()=>{contextListener=null;};}});
  const cleanup=page.mount(root);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(loaded,1);assert.match(host.innerHTML,/Loaded/);assert.equal(handlers.size,2);
  contextListener();assert.equal(invalidated,true);assert.match(host.innerHTML,/Account or congregation changed/);
  cleanup();assert.equal(disposed,true);assert.equal(listener,null);assert.equal(contextListener,null);assert.equal(handlers.size,0);
});

test('navigation callbacks remain feature-local and do not invent a route owner',()=>{
  const state=base();let listener;const controller={getState:()=>state,subscribe(fn){listener=fn;return()=>{};},async load(){},invalidate(){},dispose(){}};
  const host={innerHTML:''};const handlers=new Map();const root={querySelector:()=>host,addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(){}};
  const calls=[];const page=curriculumAuthoringPage({controller,onBack:()=>calls.push('back'),onAccount:()=>calls.push('account'),onCongregation:()=>calls.push('congregation')});
  const cleanup=page.mount(root);
  for(const nav of ['back','account','congregation'])handlers.get('click')({target:{closest(){return this;},getAttribute(name){return name==='data-authoring-nav'?nav:null;}}});
  assert.deepEqual(calls,['back','account','congregation']);cleanup();void listener;
});
