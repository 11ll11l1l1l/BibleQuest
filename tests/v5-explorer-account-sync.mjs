import assert from 'node:assert/strict';
import { createExplorerService } from '../src/app/explorer.js';
import { createExplorerCloudSyncService } from '../src/app/explorer-cloud-sync.js';

function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function ownerStorage(){
  const map=new Map();
  return {
    getItem(key){return map.has(key)?map.get(key):null},
    setItem(key,value){map.set(key,String(value));return value},
    removeItem(key){map.delete(key)}
  };
}
function accountSession(userId='11111111-1111-1111-1111-111111111111'){
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
function make(iso,random=()=>0){
  let now=new Date(iso);
  const service=createExplorerService({storage:memoryStorage(),clock:()=>new Date(now),random});
  return {service,setTime(value){now=new Date(value)}};
}

const api=cloudApi(),session=accountSession();
const a=make('2026-09-21T01:00:00.000Z'),b=make('2026-09-21T02:00:00.000Z');
const syncA=createExplorerCloudSyncService({
  api,session,explorer:a.service,ownerStorage:ownerStorage(),cacheStorage:memoryStorage()
});
const syncB=createExplorerCloudSyncService({
  api,session,explorer:b.service,ownerStorage:ownerStorage(),cacheStorage:memoryStorage()
});

const aStart=a.service.start('person').state;
a.service.nextClue('person');
await syncA.flush();
assert.deepEqual(api.inspect().state.legacy_progress,{keep:true},'Explorer sync must preserve unrelated progress-snapshot slices.');

await syncB.syncNow();
let bPeople=b.service.snapshot('person');
assert.equal(bPeople.session.item.id,aStart.session.item.id,'Device B must resume Device A exact Explorer item.');
assert.equal(bPeople.session.clueIndex,1,'Device B must resume Device A exact clue position.');
assert.equal(bPeople.seenCount,1);

b.setTime('2026-09-21T03:00:00.000Z');
b.service.nextClue('person');
b.service.reveal('person');
const bNext=b.service.nextCase('person');
await syncB.flush();
await syncA.syncNow();
const aMerged=a.service.snapshot('person');
assert.equal(aMerged.session.item.id,bNext.session.item.id,'Device A must receive Device B next Explorer case.');
assert.equal(aMerged.seenCount,2,'Cross-device Explorer history must merge without repeating the previous item.');

// Concurrent activity in different Explorer modes must preserve both sessions.
const c=make('2026-09-21T04:00:00.000Z',()=>0.2),d=make('2026-09-21T05:00:00.000Z',()=>0.8);
c.service.mergeFromAccount(api.inspect().state.biblequest_explorer_v1);
d.service.mergeFromAccount(api.inspect().state.biblequest_explorer_v1);
c.service.start('place');
c.service.nextClue('place');
d.service.nextClue('person');
const syncC=createExplorerCloudSyncService({
  api,session,explorer:c.service,ownerStorage:ownerStorage(),cacheStorage:memoryStorage()
});
api.conflictNextSaveWith(d.service.exportAccountState());
await syncC.syncNow();
assert.equal(c.service.snapshot('place').session.clueIndex,1,'Conflict merge must retain the local Places session.');
assert.equal(c.service.snapshot('person').session.clueIndex,d.service.snapshot('person').session.clueIndex,'Conflict merge must retain the remote People session.');
assert.equal(Boolean(api.inspect().state.biblequest_explorer_v1.sessions.place),true);
assert.equal(Boolean(api.inspect().state.biblequest_explorer_v1.sessions.person),true);

// Account switching must isolate Explorer history and unfinished cases.
const isolated=make('2026-09-21T06:00:00.000Z');
const sharedOwner=ownerStorage(),sharedCache=memoryStorage();
const firstSession=accountSession('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
const firstSync=createExplorerCloudSyncService({
  api:{async load(){return null},async saveSlice(user,key,value){return {user_id:user,state:{[key]:value},updated_at:'2026-09-21T06:00:00.000Z'}}},
  session:firstSession,explorer:isolated.service,ownerStorage:sharedOwner,cacheStorage:sharedCache
});
isolated.service.start('person');
await firstSync.flush();
firstSync.dispose();

const secondSession=accountSession('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
const secondSync=createExplorerCloudSyncService({
  api:{async load(){return null},async saveSlice(user,key,value){return {user_id:user,state:{[key]:value},updated_at:'2026-09-21T07:00:00.000Z'}}},
  session:secondSession,explorer:isolated.service,ownerStorage:sharedOwner,cacheStorage:sharedCache
});
await secondSync.syncNow();
assert.equal(isolated.service.snapshot('person').session,null,'A different account must not inherit another user’s unfinished Explorer case.');
assert.equal(isolated.service.snapshot('person').seenCount,0,'A different account must not inherit another user’s Explorer history.');

syncA.dispose();syncB.dispose();syncC.dispose();secondSync.dispose();
console.log('BibleQuest V5 Bible Explorer account auto-resume regression passed.');
