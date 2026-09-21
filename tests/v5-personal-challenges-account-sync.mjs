import assert from 'node:assert/strict';
import { createPersonalChallengesService } from '../src/app/personal-challenges.js';
import { createPersonalChallengesCloudSyncService } from '../src/app/personal-challenges-cloud-sync.js';

function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function memoryOwnerStorage(){
  const map=new Map();
  return {
    getItem(key){return map.has(key)?map.get(key):null},
    setItem(key,value){map.set(key,String(value));return value},
    removeItem(key){map.delete(key)}
  };
}
function session(userId='11111111-1111-1111-1111-111111111111'){
  const state={authenticated:true,user:{id:userId}};
  const listeners=new Set();
  return {
    getState(){return state},
    beforeSignOut(listener){listeners.add(listener);return()=>listeners.delete(listener)}
  };
}
function cloudApi(){
  let tick=0,beforeNextSave=null;
  let row={user_id:'11111111-1111-1111-1111-111111111111',state:{legacy_progress:{keep:true}},schema_version:1,updated_at:'2026-09-21T00:00:00.000Z'};
  const stamp=()=> '2026-09-21T00:00:'+String(++tick).padStart(2,'0')+'.000Z';
  return {
    async load(){return structuredClone(row)},
    async saveSlice(userId,key,value,{expectedUpdatedAt=undefined}={}){
      if(beforeNextSave){
        row={...row,state:{...row.state,[key]:structuredClone(beforeNextSave)},updated_at:stamp()};
        beforeNextSave=null;
      }
      const actual=row.updated_at||null;
      const expected=expectedUpdatedAt===undefined?undefined:(expectedUpdatedAt||null);
      if(expected!==undefined&&expected!==actual){
        const error=new Error('simulated concurrent snapshot update');
        error.code='BQ_PROGRESS_SNAPSHOT_CONFLICT';
        throw error;
      }
      row={user_id:userId,state:{...row.state,[key]:structuredClone(value)},schema_version:1,updated_at:stamp()};
      return structuredClone(row);
    },
    conflictNextSaveWith(value){beforeNextSave=structuredClone(value)},
    inspect(){return structuredClone(row)}
  };
}
function make(iso){
  let now=new Date(iso);
  const service=createPersonalChallengesService({storage:memoryStorage(),clock:()=>new Date(now)});
  return {service,setTime(value){now=new Date(value)}};
}

const api=cloudApi(),account=session();
const a=make('2026-09-21T01:00:00.000Z'),b=make('2026-09-21T02:00:00.000Z');
const syncA=createPersonalChallengesCloudSyncService({
  api,session:account,challenges:a.service,ownerStorage:memoryOwnerStorage(),cacheStorage:memoryStorage()
});
const syncB=createPersonalChallengesCloudSyncService({
  api,session:account,challenges:b.service,ownerStorage:memoryOwnerStorage(),cacheStorage:memoryStorage()
});

a.service.start('gospel7');
a.service.completeNext('gospel7',1);
await syncA.flush();
assert.equal(Boolean(api.inspect().state.biblequest_personal_challenges_v1.gospel7.completedAt['1']),true,'Device A challenge day must sync to the account snapshot.');
assert.deepEqual(api.inspect().state.legacy_progress,{keep:true},'Personal Challenge sync must preserve unrelated snapshot slices.');

await syncB.syncNow();
assert.equal(b.service.snapshot('gospel7').completed,1,'Device B must resume Device A challenge progress.');
assert.equal(b.service.snapshot('gospel7').nextDay,2);

b.setTime('2026-09-21T03:00:00.000Z');
b.service.completeNext('gospel7',2);
await syncB.flush();
await syncA.syncNow();
assert.equal(a.service.snapshot('gospel7').completed,2,'Device A must merge newer Device B challenge progress.');
assert.equal(a.service.snapshot('gospel7').nextDay,3);

// Concurrent edits to different challenges must merge after optimistic conflict.
const c=make('2026-09-21T04:00:00.000Z'),d=make('2026-09-21T05:00:00.000Z');
c.service.mergeFromAccount(api.inspect().state.biblequest_personal_challenges_v1);
d.service.mergeFromAccount(api.inspect().state.biblequest_personal_challenges_v1);
c.service.start('john21');
c.service.completeNext('john21',1);
d.service.start('james5');
d.service.completeNext('james5',1);
const syncC=createPersonalChallengesCloudSyncService({
  api,session:account,challenges:c.service,ownerStorage:memoryOwnerStorage(),cacheStorage:memoryStorage()
});
api.conflictNextSaveWith(d.service.exportAccountState());
await syncC.syncNow();
assert.equal(c.service.snapshot('john21').completed,1);
assert.equal(c.service.snapshot('james5').completed,1,'Conflict retry must preserve a different device challenge.');
assert.equal(Boolean(api.inspect().state.biblequest_personal_challenges_v1.john21.completedAt['1']),true);
assert.equal(Boolean(api.inspect().state.biblequest_personal_challenges_v1.james5.completedAt['1']),true);

// Switching accounts must not leak the previous account's challenge state.
const isolated=make('2026-09-21T06:00:00.000Z');
const ownerStore=memoryOwnerStorage(),cacheStore=memoryStorage();
const firstSession=session('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
const firstSync=createPersonalChallengesCloudSyncService({
  api:{async load(){return null},async saveSlice(user,key,value){return {user_id:user,state:{[key]:value},updated_at:'2026-09-21T06:00:00.000Z'}}},
  session:firstSession,challenges:isolated.service,ownerStorage:ownerStore,cacheStorage:cacheStore
});
isolated.service.start('acts28');
await firstSync.flush();
firstSync.dispose();

const secondSession=session('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
const secondSync=createPersonalChallengesCloudSyncService({
  api:{async load(){return null},async saveSlice(user,key,value){return {user_id:user,state:{[key]:value},updated_at:'2026-09-21T07:00:00.000Z'}}},
  session:secondSession,challenges:isolated.service,ownerStorage:ownerStore,cacheStorage:cacheStore
});
await secondSync.syncNow();
assert.equal(isolated.service.snapshot('acts28').started,false,'A different signed-in account must not inherit the prior account challenge state.');

syncA.dispose();syncB.dispose();syncC.dispose();secondSync.dispose();
console.log('BibleQuest V5 Personal Challenge account auto-resume regression passed.');
