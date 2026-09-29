import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCongregationMembershipService } from '../../src/app/congregation-membership.js';

function fixture(role='admin'){
  const calls=[];
  const session={getState:()=>({authenticated:true,user:{id:'u1'}})};
  const api={congregation:{async listMemberships(userId){return [{user_id:userId,congregation_id:'c1',role,active:true,congregation:{id:'c1',name:'First Church',timezone:'Asia/Tokyo'}}]},async updateSettings(...args){calls.push(args);return {}},async listManagedMembers(){return {congregationId:'c1',members:[{userId:'u2',displayName:'Second Member',role:'member',active:true}]}},async manageMember(...args){calls.push(args);return {membership:{congregationId:args[0],userId:args[1],role:args[2],active:args[3]}}}}};
  const owner=createCongregationMembershipService({api,session});
  return {owner,calls};
}

test('only the active congregation admin may update validated profile settings',async()=>{
  const {owner,calls}=fixture();
  await owner.load();
  await owner.updateSettings({name:' New name ',timezone:'America/Los_Angeles'});
  assert.deepEqual(calls,[['c1',{name:'New name',timezone:'America/Los_Angeles'}]]);
  await assert.rejects(owner.updateSettings({name:'x',timezone:'UTC'}),/between 2 and 100/);
  await assert.rejects(owner.updateSettings({name:'Valid',timezone:'Not/A_Zone'}),/valid time zone/);
});

test('congregation admin member management remains tenant-scoped and validates returned identities',async()=>{
  const {owner,calls}=fixture();
  await owner.load();
  assert.deepEqual(await owner.loadManagedMembers(),[{userId:'u2',displayName:'Second Member',role:'member',active:true,joinedAt:null}]);
  assert.deepEqual(await owner.manageMember({userId:'u2',role:'pastor',active:true}),[{userId:'u2',displayName:'Second Member',role:'member',active:true,joinedAt:null}]);
  assert.deepEqual(calls[0],['c1','u2','pastor',true]);
  await assert.rejects(owner.manageMember({userId:'',role:'admin',active:true}),/Choose a member/);
  const member=fixture('member');
  await member.owner.load();
  await assert.rejects(member.owner.loadManagedMembers(),/admin permission/);
});

test('members cannot edit settings and server endpoint rechecks role before service writes',async()=>{
  const {owner}=fixture('leader');
  await owner.load();
  await assert.rejects(owner.updateSettings({name:'Valid Name',timezone:'Asia/Tokyo'}),/admin permission/);
  const endpoint=await readFile(new URL('../../supabase/functions/bq-congregation-settings/index.ts',import.meta.url),'utf8');
  assert.match(endpoint,/activeMembership\(admin,congregationId,user\.id\)/);
  assert.match(endpoint,/member\.role!=='admin'/);
  assert.match(endpoint,/update\(\{name,timezone\}\)/);
});

test('member admin writes run transactionally with audit and owner/last-admin guards',async()=>{
  const migration=await readFile(new URL('../../supabase/migrations/20260928150000_congregation_member_management.sql',import.meta.url),'utf8');
  const edge=await readFile(new URL('../../supabase/functions/bq-congregation-members/index.ts',import.meta.url),'utf8');
  const page=await readFile(new URL('../../src/features/congregation/index.js',import.meta.url),'utf8');
  const platformAdmin=await readFile(new URL('../../supabase/functions/bq-admin/index.ts',import.meta.url),'utf8');
  assert.match(migration,/for update/);
  assert.match(migration,/at least one active admin/);
  assert.match(migration,/Transfer congregation ownership/);
  assert.match(migration,/bible_congregation_membership_audit/);
  assert.match(migration,/to service_role/);
  assert.match(edge,/actor\.role!=='admin'/);
  assert.match(edge,/admin\.rpc\('bible_manage_congregation_member_v6'/);
  assert.match(platformAdmin,/rpc\('bible_manage_congregation_member_v6'/);
  assert.match(page,/data-congregation-member-form/);
});

test('membership response never selects an inactive or mismatched congregation as client context',async()=>{
  const session={getState:()=>({authenticated:true,user:{id:'u1'}})};
  const rows=[
    {user_id:'u1',congregation_id:'c1',role:'admin',active:false,congregation:{id:'c1',name:'Inactive member'}},
    {user_id:'u1',congregation_id:'c2',role:'admin',active:true,congregation:{id:'foreign',name:'Foreign congregation'}},
    {user_id:'u1',congregation_id:'c3',role:'admin',active:true,congregation:{id:'c3',name:'Inactive congregation',active:false}},
    {user_id:'u1',congregation_id:'c4',role:'member',active:true,congregation:{id:'c4',name:'Valid',active:true}},
  ];
  const owner=createCongregationMembershipService({api:{congregation:{listMemberships:async()=>rows}},session});
  const memberships=await owner.load();
  assert.deepEqual(memberships.map(row=>row.congregationId),['c4']);
  assert.equal(owner.getActive()?.congregationId,'c4');
  for(const id of ['c1','c2','c3']){
    assert.equal(owner.can(id,'read'),false);
    assert.throws(()=>owner.setActive(id),/not a member/);
  }
});

test('member administration rejects cross-congregation list and mutation responses',async()=>{
  const session={getState:()=>({authenticated:true,user:{id:'u1'}})};
  const memberships=async()=>[{user_id:'u1',congregation_id:'c1',role:'admin',active:true,congregation:{id:'c1',name:'Valid'}}];
  const api={congregation:{listMemberships:memberships,
    listManagedMembers:async()=>({congregationId:'c2',members:[{userId:'foreign',role:'admin'}]}),
    manageMember:async()=>({membership:{congregationId:'c2',userId:'u2',role:'pastor',active:true}})}};
  const owner=createCongregationMembershipService({api,session});
  await owner.load();
  await assert.rejects(owner.loadManagedMembers(),/Invalid member list scope/);
  await assert.rejects(owner.manageMember({userId:'u2',role:'pastor',active:true}),/Invalid member update scope/);
});
