import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLeaderboardsService } from '../../src/app/leaderboards.js';

const member=(congregationId,name)=>({congregationId,roleLabel:'Member',congregation:{id:congregationId,name,timezone:'Asia/Tokyo'}});
const row=(congregationId,userId)=>({congregation_id:congregationId,user_id:userId,display_name:userId,active:true,avatar:null});

describe('Leaderboards active congregation context',()=>{
  it('uses the active congregation by default and rejects a late prior-tenant response',async()=>{
    let active='cong-a',releaseA;
    const pendingA=new Promise(resolve=>{releaseA=resolve});
    const memberships=[member('cong-a','Alpha'),member('cong-b','Beta')];
    const congregation={load:async()=>memberships,getActive:()=>memberships.find(x=>x.congregationId===active),assert:()=>true};
    const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'user-1'}})};
    const api={load:async cid=>cid==='cong-a'?pendingA:{directory:[row('cong-b','user-1')],scores:[]}};
    const service=createLeaderboardsService({api,session,congregation,clock:()=>new Date('2026-09-25T00:00:00Z')});
    const first=service.load();
    active='cong-b';
    releaseA({directory:[row('cong-a','user-1')],scores:[]});
    const stale=await first;
    assert.notEqual(stale.congregationId,'cong-a');
    const fresh=await service.load();
    assert.equal(fresh.congregationId,'cong-b');
  });

  it('preserves explicit congregation selection independently of global active selection',async()=>{
    let active='cong-b';
    const memberships=[member('cong-a','Alpha'),member('cong-b','Beta')];
    const congregation={load:async()=>memberships,getActive:()=>memberships.find(x=>x.congregationId===active),assert:()=>true};
    const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'user-1'}})};
    const api={load:async cid=>({directory:[row(cid,'user-1')],scores:[]})};
    const service=createLeaderboardsService({api,session,congregation});
    const explicit=await service.load({congregationId:'cong-a'});
    assert.equal(explicit.congregationId,'cong-a');
  });
});