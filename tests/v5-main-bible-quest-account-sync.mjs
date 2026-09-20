import assert from 'node:assert/strict';
import { BIBLE_BOOKS } from '../src/core/bible.js';
import { createBibleQuestService } from '../src/app/bible-quest.js';
import { createBibleQuestCloudSyncService } from '../src/app/bible-quest-cloud-sync.js';

function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function session(userId='11111111-1111-1111-1111-111111111111'){
  const state={authenticated:true,user:{id:userId}};
  const signOutListeners=new Set();
  return {
    getState(){return state},
    beforeSignOut(listener){signOutListeners.add(listener);return()=>signOutListeners.delete(listener)}
  };
}
function cloudApi(){
  let row={user_id:'11111111-1111-1111-1111-111111111111',state:{legacy_progress:{keep:true}},schema_version:1,updated_at:'2026-09-20T00:00:00.000Z'};
  let tick=0;
  return {
    async load(){return structuredClone(row)},
    async saveSlice(userId,key,value){
      tick+=1;
      row={
        user_id:userId,
        state:{...row.state,[key]:structuredClone(value)},
        schema_version:1,
        updated_at:`2026-09-20T00:00:${String(tick).padStart(2,'0')}.000Z`
      };
      return structuredClone(row);
    },
    inspect(){return structuredClone(row)}
  };
}
function makeQuest(storage,startMs){
  let now=startMs;
  return {
    quest:createBibleQuestService({storage,books:BIBLE_BOOKS,clock:()=>new Date(now++),progress:{record(){}}}),
    advance(){
      const q=this.quest.activateNext();
      const target=q.next;
      return this.quest.completeActive({code:target.code,chapter:target.chapter,translation:'bsb',source:'reader'});
    }
  };
}

const api=cloudApi(),account=session();
const a=makeQuest(memoryStorage(),Date.parse('2026-09-20T01:00:00Z'));
const b=makeQuest(memoryStorage(),Date.parse('2026-09-20T02:00:00Z'));
const syncA=createBibleQuestCloudSyncService({api,session:account,bibleQuest:a.quest});
const syncB=createBibleQuestCloudSyncService({api,session:account,bibleQuest:b.quest});

a.advance();
await syncA.flush();
assert.equal(api.inspect().state.biblequest_main_bible_quest_v1.completed['GEN:1']?.translation,'bsb','Device A completion should auto-save into the account snapshot.');
assert.deepEqual(api.inspect().state.legacy_progress,{keep:true},'Main Quest account sync must preserve unrelated progress snapshot slices.');

await syncB.syncNow();
assert.equal(b.quest.snapshot().completedChapters,1,'Device B should auto-resume Device A progress from the same account.');
assert.equal(b.quest.snapshot().next.key,'GEN:2');

b.advance();
await syncB.flush();
assert.equal(api.inspect().state.biblequest_main_bible_quest_v1.completed['GEN:2']?.translation,'bsb','Device B progress should sync back to the account.');

await syncA.syncNow();
assert.equal(a.quest.snapshot().completedChapters,2,'Device A should resume the newer Device B account position.');
assert.equal(a.quest.snapshot().next.key,'GEN:3');

const stale=makeQuest(memoryStorage(),Date.parse('2026-09-20T03:00:00Z'));
const staleSync=createBibleQuestCloudSyncService({api,session:account,bibleQuest:stale.quest});
stale.advance();
assert.equal(stale.quest.snapshot().completedChapters,1);
await staleSync.syncNow();
assert.equal(stale.quest.snapshot().completedChapters,2,'A stale device must move forward to the farther cloud prefix, never push the account backward.');
assert.equal(api.inspect().state.biblequest_main_bible_quest_v1.completed['GEN:2']?.translation,'bsb');

syncA.dispose();syncB.dispose();staleSync.dispose();
console.log('BibleQuest V5 account auto-resume two-device regression passed.');
