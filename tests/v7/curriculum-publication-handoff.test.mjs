import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationHandoff, renderPublicationHandoff } from '../../src/features/curriculum-authoring/publication-handoff.js';
import { V7_PUBLICATION_HANDOFF_KEY_INVENTORY } from '../../src/content/locales/v7-publication-handoff.js';

const request=Object.freeze({
  trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'revision-1',
  expectedTrackRevisionId:'track-r1',expectedModuleRevisionId:'module-r1',expectedLessonRevisionId:'lesson-r1',libraryRevisionIds:[],
});
const ready={ready:true,request,stepCount:7};
const receipt=(overrides={})=>({
  trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'revision-1',
  trackPublicationState:'published',modulePublicationState:'published',lessonPublicationState:'published',
  publishedAt:'2026-10-05T00:00:00Z',...overrides,
});

test('renders preparation only without an authority and real publish only when authority is injected',()=>{
  const blocked=renderPublicationHandoff({ready:false,request:null});
  assert.match(blocked,/Complete publication readiness/);assert.doesNotMatch(blocked,/data-publication-handoff-action="prepare"/);
  const prepared=renderPublicationHandoff(ready);
  assert.match(prepared,/Prepare publication request/);assert.match(prepared,/does not publish curriculum/);
  assert.match(prepared,/data-publication-handoff-action="prepare"/);assert.doesNotMatch(prepared,/data-publication-handoff-action="publish"|>Publish curriculum</);
  const publishing=renderPublicationHandoff(ready,{canPublish:true});
  assert.match(publishing,/data-publication-handoff-action="publish"/);assert.match(publishing,/>Publish curriculum</);
  assert.doesNotMatch(publishing,/does not publish curriculum/);
});

test('visible publication handoff strings are registered for English fallback',()=>{
  for(const key of ['v7.publicationHandoff.title','v7.publicationHandoff.prepare','v7.publicationHandoff.publish','v7.publicationHandoff.publishing','v7.publicationHandoff.published','v7.publicationHandoff.error','v7.publicationHandoff.backendPending']){
    assert.equal(V7_PUBLICATION_HANDOFF_KEY_INVENTORY.includes(key),true,key);
  }
  const html=renderPublicationHandoff(ready,{translate:key=>`[${key}]`});
  assert.match(html,/\[v7\.publicationHandoff\.title\]/);assert.doesNotMatch(html,/>Publication handoff</);
});

test('preparation-only mode forwards exactly the locally prepared immutable request and exposes no publish method',async()=>{
  const calls=[];const handoff=publicationHandoff({preparePublication(){calls.push('prepare-local');return request;},async onPrepared(value){calls.push(['callback',value]);}});
  const result=await handoff.prepare();
  assert.equal(result,request);assert.deepEqual(calls,['prepare-local',['callback',request]]);
  assert.equal('publish' in handoff,false);
});

test('authority mode publishes the exact locally prepared request and retains only an exact success acknowledgement',async()=>{
  const calls=[],published=[];
  const handoff=publicationHandoff({preparePublication:()=>request,publish:async value=>{calls.push(value);return receipt();},onPublished:value=>published.push(value)});
  assert.equal(typeof handoff.publish,'function');
  const result=await handoff.publish();
  assert.deepEqual(calls,[request]);assert.equal(result.lessonRevisionId,request.lessonRevisionId);assert.equal(result.lessonPublicationState,'published');
  assert.deepEqual(published,[result]);assert.equal(handoff.receipt,result);
  assert.match(handoff.render(ready),/Curriculum published successfully/);
});

test('false-success publication acknowledgements fail closed and never render success',async()=>{
  for(const result of [
    receipt({lessonRevisionId:'foreign'}),
    receipt({lessonPublicationState:'withdrawn'}),
    receipt({publishedAt:'not-a-time'}),
  ]){
    const handoff=publicationHandoff({preparePublication:()=>request,publish:async()=>result});
    await assert.rejects(()=>handoff.publish(),{code:'BQ_AUTHORING_PUBLICATION_ACK_INVALID'});
    assert.equal(handoff.receipt,null);assert.match(handoff.render(ready),/Publication could not complete this action/);assert.doesNotMatch(handoff.render(ready),/published successfully/);
  }
});

test('busy actions are disabled and duplicate publish fails closed',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const handoff=publicationHandoff({preparePublication:()=>request,publish:async()=>{await gate;return receipt();}});
  const first=handoff.publish();assert.equal(handoff.busy,true);assert.match(handoff.render(ready),/Publishing curriculum/);assert.match(handoff.render(ready),/data-publication-handoff-action="publish" disabled/);
  await assert.rejects(()=>handoff.publish(),{code:'BQ_AUTHORING_PUBLICATION_BUSY'});release();await first;assert.equal(handoff.busy,false);
});

test('confirmed backend publication remains success when a post-success callback fails',async()=>{
  const handoff=publicationHandoff({preparePublication:()=>request,publish:async()=>receipt(),onPublished:async()=>{throw new Error('route unavailable');}});
  await handoff.publish();assert.match(handoff.render(ready),/Curriculum published successfully/);assert.doesNotMatch(handoff.render(ready),/could not complete/);
});

test('reset suppresses a late acknowledgement when the selected publication path changes',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const handoff=publicationHandoff({preparePublication:()=>request,publish:async()=>{await gate;return receipt();}});
  const active=handoff.publish();assert.equal(handoff.busy,true);handoff.reset();assert.equal(handoff.busy,false);release();await active;
  assert.equal(handoff.receipt,null);assert.doesNotMatch(handoff.render(ready),/published successfully/);
});

test('disposed handoff suppresses late UI success and rejects later actions',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const handoff=publicationHandoff({preparePublication:()=>request,publish:async()=>{await gate;return receipt();}});
  const active=handoff.publish();handoff.dispose();release();await active;
  assert.equal(handoff.receipt,null);assert.doesNotMatch(handoff.render(ready),/published successfully/);
  await assert.rejects(()=>handoff.prepare(),{code:'BQ_AUTHORING_PUBLICATION_DISPOSED'});
});
