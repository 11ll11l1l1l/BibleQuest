import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiscipleshipPairRepository} from '../../src/app/discipleship-pair-repository.js';
import {createDiscipleshipService} from '../../src/app/discipleship.js';
import {oneToOnePage} from '../../src/features/one-to-one/index.js';
const userId='00000000-0000-4000-8000-000000000001',congregationId='00000000-0000-4000-8000-000000000002',pairId='00000000-0000-4000-8000-000000000003';
const context={userId,congregationId};
function setup({account=userId,rows=[],error=null}={}){
  const calls=[];
  const query={then(resolve,reject){return Promise.resolve({data:rows,error}).then(resolve,reject)}};
  for(const method of ['select','eq','or','order','limit','maybeSingle'])query[method]=(...args)=>{calls.push([method,...args]);return query};
  const repository=createDiscipleshipPairRepository(async()=>({auth:{getUser:async()=>({data:{user:{id:account}},error:null})},from:name=>{calls.push(['from',name]);return query}}));
  return {repository,calls};
}
test('pair reads use authenticated account, explicit congregation and participant filters',async()=>{
  const {repository,calls}=setup();
  assert.deepEqual(await repository.listPairs(context),[]);
  assert.ok(calls.some(row=>row[0]==='eq'&&row[1]==='congregation_id'&&row[2]===congregationId));
  assert.ok(calls.some(row=>row[0]==='or'&&row[1]===`mentor_id.eq.${userId},mentee_id.eq.${userId}`));
  assert.ok(calls.some(row=>row[0]==='limit'&&row[1]===100));
  await repository.getPair(pairId,context);
  assert.ok(calls.some(row=>row[0]==='eq'&&row[1]==='id'&&row[2]===pairId));
});
test('malformed filter IDs and changed authenticated accounts fail before querying',async()=>{
  const {repository,calls}=setup({account:pairId});
  await assert.rejects(repository.listPairs({...context,userId:'bad,mentor_id.eq.other'}));
  await assert.rejects(repository.listPairs(context),/account changed/);
  assert.equal(calls.length,0);
});
test('service rejects unexpected cross-congregation rows and repository preserves failures',async()=>{
  const {repository}=setup({rows:[{id:pairId,congregation_id:pairId,mentor_id:userId,mentee_id:congregationId,state:'active'}]});
  const service=createDiscipleshipService({repository,session:{getState:()=>({authenticated:true,user:{id:userId}})},membership:{getActive:()=>({userId,congregationId})}});
  await assert.rejects(service.listPairs(),/outside the selected congregation/);
  await assert.rejects(setup({error:new Error('unavailable')}).repository.listPairs(context),/unavailable/);
});
test('landing clears results and ignores a late response after context change or disposal',async()=>{
  let finish,contextChanged,unsubscribed=false;
  const nodes=new Map();
  const root={querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',addEventListener(){},removeEventListener(){}});return nodes.get(selector)}};
  const cleanup=oneToOnePage({service:{listPairs:()=>new Promise(resolve=>{finish=resolve})},subscribeContext:fn=>{contextChanged=fn;return()=>{unsubscribed=true}},onAccount(){},onCongregation(){},onBack(){}}).mount(root);
  contextChanged();
  finish([{state:'active'}]);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(nodes.get('[data-pair-results]').innerHTML,'');
  assert.match(nodes.get('[data-pair-status]').textContent,/changed/);
  cleanup();assert.equal(unsubscribed,true);
});
