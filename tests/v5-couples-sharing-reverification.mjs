import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCouplesCloudService } from '../src/app/couples-cloud.js';

const pair={id:'pair-1',user_a:'spouse-a',user_b:'spouse-b',status:'active',created_at:'2026-09-13T00:00:00Z',updated_at:'2026-09-13T00:00:00Z'};
const rows=[];
let nextId=1;
const sessionFor=userId=>({getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})});
const apiFor=userId=>({
  async status(){return {pair}},
  async listShared(pairId){assert.equal(pairId,pair.id);return rows.filter(row=>row.pair_id===pairId).map(row=>({...row}))},
  async addShared(nextRows){
    for(const row of nextRows){
      assert.equal(row.pair_id,pair.id,'shared write must remain scoped to the active pair');
      assert.equal(row.author_id,userId,'shared write must retain the signed-in author');
      assert.ok(['journey','commitment','challenge'].includes(row.item_type),'only intentional Couples shared types may enter shared history');
      rows.push({...row,id:`shared-${nextId++}`,created_at:new Date(1_780_000_000_000+nextId*1000).toISOString(),updated_at:null,due_on:null,completed_at:null});
    }
    return rows;
  }
});

const spouseA=createCouplesCloudService({api:apiFor('spouse-a'),session:sessionFor('spouse-a')});
const spouseB=createCouplesCloudService({api:apiFor('spouse-b'),session:sessionFor('spouse-b')});

await spouseA.load();
await spouseB.load();
await spouseA.completeJourney(1,'Pray Honestly','A will pray for B this week.');
await spouseB.refreshShared();
assert.ok(spouseB.snapshot().shared.some(item=>item.authorId==='spouse-a'&&item.itemType==='commitment'&&item.body==='A will pray for B this week.'),'partner B must receive partner A shared commitment');

await spouseB.completeJourney(2,'Listen First','B will listen before advising.');
await spouseA.refreshShared();
assert.ok(spouseA.snapshot().shared.some(item=>item.authorId==='spouse-b'&&item.itemType==='commitment'&&item.body==='B will listen before advising.'),'partner A must receive partner B shared commitment');
assert.ok(spouseA.snapshot().shared.some(item=>item.authorId==='spouse-a'),'partner A must retain own shared history');
assert.ok(spouseA.snapshot().shared.some(item=>item.authorId==='spouse-b'),'partner A must also receive partner-authored shared history');

const wrongPairApi={...apiFor('spouse-a'),async listShared(){return [{id:'bad',pair_id:'pair-elsewhere',author_id:'intruder',item_type:'commitment',body:'must not cross pair boundary',created_at:'2026-09-13T00:00:00Z'}]}};
const guarded=createCouplesCloudService({api:wrongPairApi,session:sessionFor('spouse-a')});
await assert.rejects(()=>guarded.load(),error=>error?.code==='BQ_COUPLES_CLOUD_MALFORMED','cross-pair shared rows must be rejected');

const feature=fs.readFileSync(new URL('../src/features/couples-cloud/index.js',import.meta.url),'utf8');
assert.match(feature,/Pairing never shares Private Notes, Transformation results, passwords, or personal account data\./,'signed-out/auth privacy boundary must be explicit');
assert.match(feature,/Private Notes, Transformation results, passwords, and personal account data remain private\./,'pairing privacy boundary must remain explicit');
assert.match(feature,/Only intentionally shared Couple Journey completions, commitments, and pair-linked couples challenge history belong to the pair\./,'shared-data scope must be explicit');
assert.doesNotMatch(feature,/api\.(notes|transformation|account)/,'Couples presentation must not acquire private-note/transformation/account data owners');

const edge=fs.readFileSync(new URL('../supabase/functions/bq-couple/index.ts',import.meta.url),'utf8');
assert.match(edge,/\.or\(`user_a\.eq\.\$\{user\.id\},user_b\.eq\.\$\{user\.id\}`\)/,'pair status must resolve membership symmetrically for either spouse');
assert.match(edge,/pair\.data\.user_a!==user\.id&&pair\.data\.user_b!==user\.id/,'pair leave authorization must reject non-members');
assert.match(edge,/inv\.data\.created_by===user\.id/,'pair creator must not join their own invite');

const hardening=fs.readFileSync(new URL('../supabase/migrations/20260905071100_couple_shared_write_hardening.sql',import.meta.url),'utf8');
assert.match(hardening,/REVOKE UPDATE ON TABLE public\.bible_couple_shared FROM authenticated/i,'shared-history UPDATE must remain revoked');
assert.match(hardening,/DROP POLICY IF EXISTS "couple shared pair update" ON public\.bible_couple_shared/i,'legacy shared-row UPDATE policy must remain removed');

console.log('v5 Couples Journey bidirectional-sharing/privacy reverification: PASS');