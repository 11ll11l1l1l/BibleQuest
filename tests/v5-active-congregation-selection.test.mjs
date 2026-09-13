import assert from 'node:assert/strict';
import test from 'node:test';
import {createCongregationMembershipService} from '../src/app/congregation-membership.js';

function makeHarness(){
  let state={authenticated:true,user:{id:'user-a'}};
  let rows=[
    {congregation_id:'cong-a',user_id:'user-a',role:'member',congregation:{id:'cong-a',name:'Alpha'}},
    {congregation_id:'cong-b',user_id:'user-a',role:'leader',congregation:{id:'cong-b',name:'Beta'}}
  ];
  const api={congregation:{
    async listMemberships(){return rows;},
    async join(){}
  }};
  const session={getState:()=>state};
  const service=createCongregationMembershipService({api,session});
  return {
    service,
    setRows(value){rows=value;},
    setUser(id){state=id?{authenticated:true,user:{id}}:{authenticated:false,user:null};}
  };
}

test('load chooses a valid first membership as the initial active congregation',async()=>{
  const h=makeHarness();
  await h.service.load();
  assert.equal(h.service.getActive()?.congregationId,'cong-a');
});

test('member can switch active congregation only to one of their loaded memberships',async()=>{
  const h=makeHarness();
  await h.service.load();
  assert.equal(h.service.setActive('cong-b').congregationId,'cong-b');
  assert.equal(h.service.getActive()?.role,'leader');
  assert.throws(()=>h.service.setActive('cong-other'),error=>error?.code==='BQ_CONGREGATION_NOT_MEMBER');
});

test('reload preserves a still-valid active congregation',async()=>{
  const h=makeHarness();
  await h.service.load();
  h.service.setActive('cong-b');
  await h.service.load();
  assert.equal(h.service.getActive()?.congregationId,'cong-b');
});

test('reload falls back safely when the selected membership is removed',async()=>{
  const h=makeHarness();
  await h.service.load();
  h.service.setActive('cong-b');
  h.setRows([{congregation_id:'cong-a',user_id:'user-a',role:'member',congregation:{id:'cong-a',name:'Alpha'}}]);
  await h.service.load();
  assert.equal(h.service.getActive()?.congregationId,'cong-a');
});

test('account switch cannot inherit the prior account active context',async()=>{
  const h=makeHarness();
  await h.service.load();
  h.service.setActive('cong-b');
  h.setUser('user-b');
  assert.equal(h.service.getActive(),null);
  assert.throws(()=>h.service.setActive('cong-b'),error=>error?.code==='BQ_CONGREGATION_CONTEXT_STALE');
  h.setRows([{congregation_id:'cong-c',user_id:'user-b',role:'member',congregation:{id:'cong-c',name:'Gamma'}}]);
  await h.service.load();
  assert.equal(h.service.getActive()?.congregationId,'cong-c');
});

test('clear and sign-out drop active congregation context',async()=>{
  const h=makeHarness();
  await h.service.load();
  h.service.clear();
  assert.equal(h.service.getActive(),null);
  h.setUser(null);
  assert.equal(h.service.getActive(),null);
});
