import assert from 'node:assert/strict';
import { createBibleDataService, BIBLE_BOOKS } from '../src/core/bible.js';
import { createProgressService } from '../src/core/progress.js';
import { createBibleQuestService } from '../src/app/bible-quest.js';
import { createReaderService } from '../src/app/reader.js';

function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function memoryStore(){
  let state={};
  return {
    setState(patch){state=typeof patch==='function'?patch(state):{...state,...patch};return state},
    getState(){return structuredClone(state)}
  };
}

const storage=memoryStorage();
const progress=createProgressService({
  storage,
  store:memoryStore(),
  clock:()=>new Date('2026-09-21T00:00:00.000Z'),
  timeZone:'UTC'
});
const bible=createBibleDataService({
  fetcher:async()=>({ok:false,async json(){return null}})
});
const quest=createBibleQuestService({
  storage,
  books:BIBLE_BOOKS,
  progress,
  clock:()=>new Date('2026-09-21T00:00:00.000Z')
});
const reader=createReaderService({bible,storage,progress,bibleQuest:quest});

// Ordinary Reader activity is independent from the ordered Quest.
reader.setBook('JHN',3);
const freeJohn=reader.markRead();
assert.equal(freeJohn.newlyRead,true);
assert.equal(quest.snapshot().completedChapters,0);
assert.equal(quest.snapshot().next.key,'GEN:1');
assert.equal(quest.snapshot().active,false);
assert.equal(progress.getState().xp,10);

// Even while a Quest target is active, reading a different chapter cannot
// silently complete or skip the required canonical target.
quest.activateNext();
assert.equal(quest.snapshot().activeKey,'GEN:1');
reader.setBook('JHN',4);
reader.markRead();
assert.equal(quest.snapshot().completedChapters,0);
assert.equal(quest.snapshot().activeKey,'GEN:1');
assert.equal(quest.snapshot().next.key,'GEN:1');

// Generic/free Reader entry explicitly leaves Quest mode. Reading the exact
// same chapter as the pending target is still free reading and cannot advance.
quest.deactivate();
reader.setBook('GEN',1);
reader.markRead();
assert.equal(quest.snapshot().active,false);
assert.equal(quest.snapshot().completedChapters,0);
assert.equal(quest.snapshot().next.key,'GEN:1');

// Marking a chapter read and completing a Quest chapter are separate user
// actions. Only the explicit Quest action advances canonical progress.
quest.activateNext();
reader.setBook('GEN',1);
const duplicateFreeMark=reader.markRead();
assert.equal(duplicateFreeMark.newlyRead,false);
assert.equal(quest.snapshot().completedChapters,0);
const completed=reader.completeQuestChapter('reader');
assert.equal(completed.applied,true);
assert.equal(quest.snapshot().completedChapters,1);
assert.equal(quest.snapshot().next.key,'GEN:2');

// After leaving Quest mode again, even reading the next required chapter
// through ordinary Reader progress cannot advance the Quest.
quest.deactivate();
reader.setBook('GEN',2);
reader.markRead();
assert.equal(quest.snapshot().completedChapters,1);
assert.equal(quest.snapshot().next.key,'GEN:2');
assert.equal(quest.snapshot().active,false);

// Reader XP/history and Main Quest completion remain independently identifiable.
assert.ok(progress.hasEvent('reader.read:bsb:JHN:3'));
assert.ok(progress.hasEvent('reader.read:bsb:JHN:4'));
assert.ok(progress.hasEvent('reader.read:bsb:GEN:1'));
assert.ok(progress.hasEvent('reader.read:bsb:GEN:2'));
assert.ok(progress.hasEvent('bible-quest:GEN:1'));
assert.equal(progress.getState().xp,40,'Four free Reader chapter marks should award Reader XP; Quest completion adds zero XP.');

console.log('BibleQuest V5 free Reader / Main Quest separation regression passed.');
