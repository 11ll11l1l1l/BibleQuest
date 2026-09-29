import test from 'node:test';
import assert from 'node:assert/strict';
import { createMinistryAnnouncementsService } from '../../src/app/ministry-announcements.js';

function fixture(role='leader'){
  const calls=[];let congregationId='c1',userId='u1';
  const service=createMinistryAnnouncementsService({
    api:{async list(id){calls.push(['list',id]);return [{id:'m1',title:'Hello',body:'Body',created_by:'u1'}]},async publish(user,cid,payload){calls.push(['publish',user,cid,payload]);return {id:'m2',...payload}}},
    session:{getState:()=>({authenticated:true,user:{id:userId}})},
    congregation:{getActive:()=>({congregationId,role}),can:(id,cap)=>id===congregationId&&cap==='ministry'&&['facilitator','leader','pastor','admin'].includes(role)}
  });
  return {service,calls,setContext:(cid,uid)=>{congregationId=cid;userId=uid}};
}

test('ministry announcements are scoped to the active congregation and validate content',async()=>{
  const {service,calls}=fixture();
  assert.equal((await service.list())[0].id,'m1');
  assert.deepEqual(await service.publish({title:' Update ',body:' Hello members '}),{id:'m2',title:'Update',publishAt:null});
  assert.deepEqual(calls[1],['publish','u1','c1',{title:'Update',body:'Hello members'}]);
  await assert.rejects(service.publish({title:'x',body:'body'}),/at least 2/);
  await assert.rejects(service.publish({title:'okay',body:''}),/Write an announcement/);
});

test('ministry announcements fail closed and detect congregation changes',async()=>{
  const member=fixture('member');
  await assert.rejects(member.service.list(),/ministry role/);
  // Swap the active congregation before the pending repository call resolves.
  let active='c1',release!: (rows: unknown[])=>void;
  const switching=createMinistryAnnouncementsService({
    api:{list:()=>new Promise(resolve=>{release=resolve}),publish:async()=>({})},
    session:{getState:()=>({authenticated:true,user:{id:'u1'}})},
    congregation:{getActive:()=>({congregationId:active,role:'leader'}),can:()=>true}
  });
  const switchedPending=switching.list();
  active='c2';
  release([{id:'m1',title:'Hello',body:'Body'}]);
  await assert.rejects(switchedPending,/changed while announcements were loading/);
});
