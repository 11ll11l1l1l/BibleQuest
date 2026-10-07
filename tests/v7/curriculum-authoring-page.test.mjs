import test from 'node:test';
import assert from 'node:assert/strict';
import {curriculumAuthoringPage,renderCurriculumAuthoring} from '../../src/features/curriculum-authoring/index.js';
import { V7_CONTENT_KEY_INVENTORY } from '../../src/content/locales/v7-content.js';

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

test('incomplete readiness renders localized blocker messages without implying publication success',()=>{
  const state=base();state.readiness={ready:false,stepCount:5,blockers:['seven_steps_incomplete','lesson_not_draft'],request:null};
  const html=renderCurriculumAuthoring(state);
  assert.match(html,/5\/7 steps complete/);assert.match(html,/All seven lesson steps are required/);assert.match(html,/Lesson is no longer a draft/);
  assert.doesNotMatch(html,/Ready for atomic publication/);
});

test('authoring strings are registered in the V7 locale inventory and renderer accepts translation injection',()=>{
  for(const key of ['v7.authoring.title','v7.authoring.track.create','v7.authoring.step.scripture','v7.authoring.readiness.ready','v7.authoring.nav.congregation']){
    assert.equal(V7_CONTENT_KEY_INVENTORY.includes(key),true,key);
  }
  const html=renderCurriculumAuthoring(base(),{translate:key=>`[${key}]`});
  assert.match(html,/\[v7\.authoring\.title\]/);assert.match(html,/\[v7\.authoring\.track\.create\]/);
  assert.doesNotMatch(html,/>ONE 2 ONE curriculum</);
});

test('repository error text is not rendered directly into the authoring surface',()=>{
  const state=base();state.error='<sensitive backend detail>';
  const html=renderCurriculumAuthoring(state);
  assert.match(html,/Curriculum authoring could not complete this action/);
  assert.doesNotMatch(html,/sensitive backend detail/);
});

test('busy authoring disables reload, readiness and the authoring fieldset',()=>{
  const state=base();state.status='saving';state.selected.revisionId='revision-1';
  const html=renderCurriculumAuthoring(state);
  assert.match(html,/data-authoring-action="reload" disabled/);assert.match(html,/data-authoring-action="readiness" disabled/);assert.match(html,/<fieldset disabled>/);assert.match(html,/Saving…/);
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


test('seven step editors restore saved content and references without changing step identity',()=>{
  const state=base();state.selected.revisionId='revision-1';
  state.steps=[{position:0,stepType:'scripture',content:{text:'Read </textarea><script>bad</script>'},scriptureRefs:[{book:'John',chapter:3,verse:16}],libraryRevisionId:'library-1'},
    {position:6,stepType:'action',content:{text:'Call a friend'},scriptureRefs:[],libraryRevisionId:null}];
  const html=renderCurriculumAuthoring(state);
  assert.equal((html.match(/data-authoring-form="step-save"/g)||[]).length,7);
  assert.match(html,/&lt;\/textarea&gt;&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>bad/);
  for(let position=0;position<7;position++)assert.match(html,new RegExp(`name="position" value="${position}"`));
  assert.match(html,/John/);assert.match(html,/value="library-1"/);assert.match(html,/Call a friend/);
  assert.doesNotMatch(html,/<select name="position">/);
});

test('context change remains authoritative when an older authoring operation rejects late',async()=>{
  let state=base(),listener,contextListener,rejectLoad;
  const pending=new Promise((resolve,reject)=>{rejectLoad=reject;});
  const controller={
    getState:()=>state,subscribe(fn){listener=fn;return()=>{listener=null;};},
    async load(){return pending;},invalidate(){state=base();listener?.(state);},dispose(){},
  };
  const host={innerHTML:''};const handlers=new Map();
  const root={querySelector(selector){return selector==='[data-curriculum-authoring]'?host:null;},addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
  const page=curriculumAuthoringPage({controller,subscribeContext(fn){contextListener=fn;return()=>{contextListener=null;};}});
  const cleanup=page.mount(root);await new Promise(resolve=>setImmediate(resolve));contextListener();
  assert.match(host.innerHTML,/Account or congregation changed/);
  rejectLoad(new Error('stale authoring failure'));await new Promise(resolve=>setImmediate(resolve));
  assert.match(host.innerHTML,/Account or congregation changed/);
  assert.doesNotMatch(host.innerHTML,/could not complete this action/);
  cleanup();
});

test('busy authoring rejects stale mutation events but keeps navigation available',async()=>{
  let state=base(),listener,loads=0,selections=0,readiness=0,creates=0,backs=0;
  const controller={
    getState:()=>state,subscribe(fn){listener=fn;return()=>{listener=null;};},async load(){loads+=1;},
    async selectTrack(){selections+=1;},async refreshReadiness(){readiness+=1;},async createTrack(){creates+=1;},
    invalidate(){},dispose(){},
  };
  const host={innerHTML:''};const handlers=new Map();
  const root={querySelector(selector){return selector==='[data-curriculum-authoring]'?host:null;},addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
  const page=curriculumAuthoringPage({controller,onBack:()=>{backs+=1;}});const cleanup=page.mount(root);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(loads,1);state={...base(),status:'saving'};listener?.(state);
  const click=(attrs,disabled=false)=>handlers.get('click')({target:{disabled,closest(){return this;},getAttribute(name){return attrs[name]??null;}}});
  click({'data-authoring-action':'reload'});click({'data-authoring-action':'readiness'});click({'data-authoring-select':'track','data-id':'track-2'});
  let prevented=0;const form={getAttribute:()=> 'track-create',elements:{namedItem:()=>({value:''})},closest(){return this;}};
  handlers.get('submit')({target:form,preventDefault(){prevented+=1;}});click({'data-authoring-nav':'back'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(loads,1);assert.equal(readiness,0);assert.equal(selections,0);assert.equal(creates,0);assert.equal(prevented,1);assert.equal(backs,1);
  cleanup();
});
