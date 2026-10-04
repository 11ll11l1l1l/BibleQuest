import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationHandoff, renderPublicationHandoff } from '../../src/features/curriculum-authoring/publication-handoff.js';
import { V7_PUBLICATION_HANDOFF_KEY_INVENTORY } from '../../src/content/locales/v7-publication-handoff.js';

const ready={ready:true,request:{lessonRevisionId:'revision-1'},stepCount:7};

test('renders preparation only when readiness is complete and never claims publication',()=>{
  const blocked=renderPublicationHandoff({ready:false,request:null});
  assert.match(blocked,/Complete publication readiness/);assert.doesNotMatch(blocked,/data-publication-handoff-action="prepare"/);
  const html=renderPublicationHandoff(ready);
  assert.match(html,/Prepare publication request/);assert.match(html,/does not publish curriculum/);
  assert.match(html,/data-publication-handoff-action="prepare"/);
  assert.doesNotMatch(html,/data-publication-handoff-action="publish"|>Publish</);
});

test('visible publication handoff strings are registered for English fallback',()=>{
  for(const key of ['v7.publicationHandoff.title','v7.publicationHandoff.prepare','v7.publicationHandoff.backendPending']){
    assert.equal(V7_PUBLICATION_HANDOFF_KEY_INVENTORY.includes(key),true,key);
  }
  const html=renderPublicationHandoff(ready,{translate:key=>`[${key}]`});
  assert.match(html,/\[v7\.publicationHandoff\.title\]/);assert.doesNotMatch(html,/>Publication handoff</);
});

test('handoff forwards exactly the locally prepared immutable request and performs no mutation itself',async()=>{
  const request=Object.freeze({trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'revision-1'});
  const calls=[];const handoff=publicationHandoff({preparePublication(){calls.push('prepare-local');return request;},async onPrepared(value){calls.push(['callback',value]);}});
  const result=await handoff.prepare();
  assert.equal(result,request);assert.deepEqual(calls,['prepare-local',['callback',request]]);
  assert.equal('publish' in handoff,false);assert.equal('archive' in handoff,false);
});

test('busy preparation is disabled and duplicate preparation fails closed',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const handoff=publicationHandoff({preparePublication:()=>Object.freeze({lessonRevisionId:'revision-1'}),onPrepared:()=>gate});
  const first=handoff.prepare();assert.equal(handoff.busy,true);assert.match(handoff.render(ready),/data-publication-handoff-action="prepare" disabled/);
  await assert.rejects(()=>handoff.prepare(),{code:'BQ_AUTHORING_PUBLICATION_BUSY'});release();await first;assert.equal(handoff.busy,false);
});

test('disposed handoff rejects later preparation',async()=>{
  const handoff=publicationHandoff({preparePublication:()=>({}),onPrepared:()=>{}});handoff.dispose();
  await assert.rejects(()=>handoff.prepare(),{code:'BQ_AUTHORING_PUBLICATION_DISPOSED'});
});
