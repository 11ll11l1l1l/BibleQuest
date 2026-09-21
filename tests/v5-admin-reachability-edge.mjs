import assert from 'node:assert/strict';
import {createAdminAccessService} from '../src/app/admin-access.js';

let sessionState={authenticated:true,user:{id:'u1'}};
const session={getState:()=>sessionState};

for(const role of ['owner','admin']){
  const access=createAdminAccessService({api:{status:async()=>({role})},session});
  const state=await access.refresh();
  assert.equal(state.status,'ready');
  assert.equal(state.authorized,true,`${role} must receive the Admin entry.`);
  assert.equal(state.role,role);
}

for(const role of ['member','leader','pastor','facilitator','']){
  const access=createAdminAccessService({api:{status:async()=>({role})},session});
  const state=await access.refresh();
  assert.equal(state.status,'ready');
  assert.equal(state.authorized,false,`${role||'empty'} must not receive the Admin entry.`);
  assert.equal(state.role,'');
}

const denied=createAdminAccessService({api:{status:async()=>{throw new Error('denied')}},session});
assert.equal((await denied.refresh()).authorized,false,'Failed verification must hide Admin access.');
assert.equal(denied.getState().status,'unavailable');

sessionState={authenticated:false,user:null};
assert.deepEqual(await denied.refresh(),{status:'idle',authorized:false,role:''});

console.log('V5 Admin reachability role boundary: PASS');
