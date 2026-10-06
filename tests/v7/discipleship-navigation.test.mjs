import test from 'node:test';
import assert from 'node:assert/strict';
import { discipleshipRoute,discipleshipHydrationTarget,lessonReaderRoute,lessonReaderContext } from '../../src/app/discipleship-navigation.js';
import { assignedPath,assignedCurriculumPage } from '../../src/features/discipleship-curriculum/index.js';
const context={pairId:'pair&one',trackId:'track',moduleId:'module',revisionId:'pinned',stepId:'scripture'};
const tracks=[{id:'track',title:'Track',modules:[{id:'module',title:'Module',lessons:[{id:'lesson',revisionId:'pinned',title:'<unsafe>'}]}]}];
test('assigned route hierarchy selects only the requested assigned track and module',()=>{
  assert.equal(assignedPath(tracks,{view:'track'}).kind,'track');
  assert.equal(assignedPath(tracks,{view:'track',trackId:'track'}).kind,'module');
  assert.equal(assignedPath(tracks,{view:'module',trackId:'track',moduleId:'module'}).rows[0].revisionId,'pinned');
  assert.throws(()=>assignedPath(tracks,{view:'module',trackId:'track',moduleId:'other'}));
  assert.throws(()=>assignedPath(tracks,{view:'track',trackId:'unassigned'}));
});
test('authenticated hydration preserves bounded ONE 2 ONE query context only',()=>{
  const lesson='#/one-to-one-lesson?pairId=pair%26one&trackId=track&moduleId=module&revisionId=pinned&stepId=scripture';
  const restored=discipleshipHydrationTarget(lesson);
  assert.equal(restored,'one-to-one-lesson?pairId=pair%26one&trackId=track&moduleId=module&revisionId=pinned&stepId=scripture');
  assert.equal(discipleshipHydrationTarget('#/one-to-one?view=authoring'),'one-to-one?view=authoring');
  assert.equal(discipleshipHydrationTarget('#/library-item?id=outside'),'');
  assert.equal(discipleshipHydrationTarget('#/one-to-one-lesson'),'');
});
test('Scripture navigation and reload preserve lesson identity with an allowlisted return route',()=>{
  const route=lessonReaderRoute({book:'JHN',chapter:15,verseStart:7},context);
  const params=new URLSearchParams(route.split('?')[1]);
  assert.equal(params.get('pairId'),'pair&one');assert.equal(params.get('verse'),'7');
  const restored=lessonReaderContext(params);assert.equal(restored.book,'JHN');assert.equal(restored.chapter,15);
  assert.equal(restored.back,discipleshipRoute({routeKey:'one-to-one-lesson',...context}));
  params.set('returnTo','https://outside.example');assert.equal(lessonReaderContext(params),null);
  assert.throws(()=>discipleshipRoute({routeKey:'outside'}));
  for(const ref of [{book:'BAD',chapter:1},{book:'JHN',chapter:22},{book:'JHN',chapter:15,verseStart:0},{book:'JHN',chapter:15,verseStart:8,verseEnd:7}])assert.throws(()=>lessonReaderRoute(ref,context));
  assert.throws(()=>lessonReaderRoute({book:'JHN',chapter:15},{}));
  for(const ref of ['John 15:7',{ref:'Jn 15:7'},{book:'John',chapter:15,verse:7}])assert.equal(lessonReaderRoute(ref,context),route);
});
function mountFixture(service,ready=()=>false){
  const events={},status={textContent:''},host={innerHTML:''},navigation=[];let notify,cleanups=0;
  const page={querySelector:key=>key==='[data-assigned-status]'?status:host,addEventListener:(key,fn)=>events[key]=fn,removeEventListener:key=>delete events[key]};
  const feature=assignedCurriculumPage({service,view:'module',...context,isContextReady:ready,subscribeContext:fn=>{notify=fn;return()=>cleanups++;},onNavigate:target=>navigation.push(target),onBack:()=>{},onAccount:()=>{},onCongregation:()=>{}});
  const dispose=feature.mount({querySelector:()=>page});
  return {host,status,events,navigation,notify:()=>notify(),dispose,get cleanups(){return cleanups;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('assigned page uses pinned revisions, escapes titles and clears late loads on context changes',async()=>{
  const f=mountFixture({loadCurriculum:async pair=>{assert.equal(pair,context.pairId);return tracks;}});await flush();assert.match(f.host.innerHTML,/&lt;unsafe&gt;/);
  f.events.click({target:{closest:()=>({getAttribute:()=> '0',hasAttribute:()=>true})}});
  assert.equal(f.navigation[0].revisionId,'pinned');assert.equal(f.navigation[0].routeKey,'one-to-one-lesson');
  f.notify();assert.equal(f.host.innerHTML,'');f.dispose();assert.equal(f.cleanups,1);assert.equal(f.events.click,undefined);
  let resolve;const stale=mountFixture({loadCurriculum:()=>new Promise(r=>resolve=r)});stale.notify();resolve(tracks);await flush();assert.equal(stale.host.innerHTML,'');stale.dispose();
});
test('deep link retries after hydrated account context without guessing a congregation',async()=>{
  let ready=false,calls=0;const f=mountFixture({loadCurriculum:async()=>{calls++;if(!ready)throw new Error('Not ready');return tracks;}},()=>ready);
  await flush();assert.equal(f.host.innerHTML,'');ready=true;f.notify();await flush();assert.match(f.host.innerHTML,/data-assigned-index/);assert.equal(calls,2);f.dispose();
});
