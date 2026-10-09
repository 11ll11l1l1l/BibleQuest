import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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

test('source-grounded scene briefs override cyclic fallback only at matching source revision', () => {
 const item=devotional('devotional.biblequest.anxiety_worry.01','One concern at a time');
 item.sourceContent.body='When your mind keeps rehearsing worries, place one concern before God.';
 const brief={devotionalId:item.id,sourceRevision:'r1',sourceTitle:'One concern at a time',
 sourceBodyAnchor:'When your mind keeps',scene:'At a kitchen table a worried person puts aside a stack of blank papers and holds only one at a time.',
 composition:'Quiet medium portrait beside a dim kitchen window',lighting:'warm lamp and cool window',
 textSafeRegion:'bottom',altText:'An adult concentrates on one blank paper while setting others aside.',
 visualFingerprint:'kitchen-one-paper-person-pauses'};
 const result=buildLaneZCoverQueue([{path:'x',items:[item]}],[],[brief]);
 assert.equal(result.queue[0].artDirectionSource,'human_source_bound_first30');
 assert.equal(result.queue[0].scene,brief.scene);
 assert.equal(result.queue[0].textSafeRegion,'bottom');
 assert.match(result.queue[0].prompt,/At a kitchen table/);
 assert.match(result.queue[0].prompt,/NO rendered text/);
 assert.equal(result.counts.verifiedComplete,0);
 item.revision='r2';
 assert.throws(()=>buildLaneZCoverQueue([{path:'x',items:[item]}],[],[brief]),/Stale source-bound/);
});

test('briefs cannot invent unknown content or duplicate visual fingerprints', () => {
 const item=devotional('devotional.biblequest.anxiety_worry.01','One concern at a time');
 item.sourceContent.body='When your mind keeps rehearsing worries and doubt.';
 const base={devotionalId:item.id,sourceRevision:'r1',sourceTitle:item.sourceContent.title,
 sourceBodyAnchor:'When your mind keeps',scene:'One human in a realistic kitchen removes one sheet from a small stack of unmarked papers on a table.',
 composition:'Quiet eye-level side profile',lighting:'blue hour and warm kitchen light',
 textSafeRegion:'bottom',altText:'One person holding one paper.',
 visualFingerprint:'single-kitchen-paper'};
 assert.throws(()=>buildLaneZCoverQueue([{path:'x',items:[item]}],[],[base,{...base,devotionalId:'devotional.biblequest.unknown.01'}]),/Duplicate source-bound visual fingerprint/);
 assert.throws(()=>buildLaneZCoverQueue([{path:'x',items:[item]}],[],[{...base,devotionalId:'devotional.biblequest.unknown.01'}]),/missing\/rights-ineligible/);
});

test('live initial 30 briefs are distinct and tied to canonical source IDs', async () => {
 const result=await readLaneZCoverQueue();
 const first30=result.queue.filter(x=>x.artDirectionSource==='human_source_bound_first30');
 assert.equal(first30.length,30,'First 30 first-party devotional stories require individual scene briefs');
 assert.equal(new Set(first30.map(x=>x.devotionalId)).size,30);
 assert.equal(new Set(first30.map(x=>x.visualIdentity)).size,30);
 assert.ok(first30.every(x=>x.altTextDraft && x.sourceBodyAnchor && x.scene.length>=80));
 assert.ok(first30.every(x=>x.state==='not_generated' || x.state==='existing_asset_requires_independent_audit'));
});

test('CLI defaults to exactly one original portrait brief and supports explicit source ID', () => {
 const cmd=new URL('../../scripts/v7-lane-z-devotional-cover-queue.mjs',import.meta.url);
 const base=[cmd.pathname];
 const first=JSON.parse(execFileSync(process.execPath,base,{encoding:'utf8'}));
 assert.equal(first.queue.length,1,'Default must never invite contact-sheet generation');
 assert.equal(first.queue[0].artDirectionSource,'human_source_bound_first30');
 const target='devotional.biblequest.anxiety_worry.01';
 const specific=JSON.parse(execFileSync(process.execPath,[...base,'--id='+target],{encoding:'utf8'}));
 assert.equal(specific.queue.length,1);
 assert.equal(specific.queue[0].devotionalId,target);
 assert.match(specific.queue[0].prompt,/apartment kitchen table/);
 assert.doesNotMatch(specific.queue[0].prompt,/Create ten covers/i);
});
