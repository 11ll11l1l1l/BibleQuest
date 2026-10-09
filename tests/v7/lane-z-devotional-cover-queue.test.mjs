import test from 'node:test';
import assert from 'node:assert/strict';
import { readLaneZCoverQueue, buildLaneZCoverQueue } from '../../scripts/v7-lane-z-devotional-cover-queue.mjs';

function devotional(id,title='Faithful next step') {
 return { id, type:'devotional', revision:'r1',
  source:{kind:'first_party'},rights:{status:'verified',allowedUses:['display','translate','modify']},
  sourceContent:{title,body:'Take a faithful small step, and trust God through uncertainty.'},
  taxonomyLinks:[{kind:'need',id:'peace'}] };
}
test('queue is sorted, stable, content-specific and cannot claim generated images', () => {
 const sources = [{path:'content/v7/devotionals/sample.json',items:[
  devotional('devotional.biblequest.courage.01','Brave tomorrow'),
  devotional('devotional.biblequest.anxiety.01','One concern at a time')
 ]}];
 const one=buildLaneZCoverQueue(sources);
 const two=buildLaneZCoverQueue(sources);
 assert.deepEqual(one,two);
 assert.equal(one.counts.eligible,2);
 assert.equal(one.counts.verifiedComplete,0);
 assert.equal(one.counts.notGenerated,2);
 assert.deepEqual(one.queue.map(x=>x.devotionalId),[
   'devotional.biblequest.anxiety.01','devotional.biblequest.courage.01'
 ]);
 assert.notEqual(one.queue[0].scene,one.queue[1].scene);
 assert.notEqual(one.queue[0].expectedCleanPath,one.queue[1].expectedCleanPath);
 assert.match(one.queue[0].prompt,/ONE standalone original 4:5 portrait/);
 assert.match(one.queue[0].prompt,/NO rendered text/);
 assert.match(one.queue[0].prompt,/One concern at a time/);
});

test('existing image sidecar is never equated with independent image QA', () => {
 const id='devotional.biblequest.anxiety.01';
 const source=[{path:'x',items:[devotional(id)]}];
 const result=buildLaneZCoverQueue(source,[{
   assetId:'existing-unverified',contentId:id,contentType:'devotional',
   visualRole:'devotional_cover',status:'production_ready'
 }]);
 assert.equal(result.queue[0].state,'existing_asset_requires_independent_audit');
 assert.equal(result.queue[0].verifiedComplete,false);
 assert.equal(result.counts.verifiedComplete,0);
 assert.equal(result.counts.requiresAudit,1);
});

test('unverified external content is withheld', () => {
 const example=devotional('devotional.external.sample');
 example.source.kind='external';
 const result=buildLaneZCoverQueue([{path:'x',items:[example]}]);
 assert.equal(result.queue[0].state,'hold_rights');
 assert.equal(result.counts.eligible,0);
});

test('duplicate and unknown art references fail closed', () => {
 const item=devotional('devotional.biblequest.anxiety.01');
 assert.throws(()=>buildLaneZCoverQueue([{path:'x',items:[item,item]}]),/Duplicate\/invalid/);
 assert.throws(()=>buildLaneZCoverQueue([{path:'x',items:[item]}],[{
   assetId:'bad',contentType:'devotional',contentId:'devotional.biblequest.missing.01',visualRole:'devotional_cover'
 }]),/Unknown devotional/);
});

test('actual V7 catalog supplies exactly 300 owned source assignments', async () => {
 const result=await readLaneZCoverQueue();
 assert.equal(result.counts.eligible,300,
   'Must map exactly the 300 original first-party devotionals');
 assert.equal(result.counts.devotionalRecords,306);
 assert.equal(result.counts.rightsHold,6);
 assert.equal(new Set(result.queue.map(x=>x.devotionalId)).size,result.queue.length);
 assert.equal(new Set(result.queue.map(x=>x.expectedCleanPath)).size,result.queue.length);
 assert.equal(result.counts.verifiedComplete,0,
   'Sidecar metadata alone must never certify artwork');
});
